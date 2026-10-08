import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './config';

export type ItemDoc = {
    _id?: ObjectId;
    text: string;
    createdAt: Date;
};

let client: MongoClient | null = null;
let db: Db | null = null;
let memServer: MongoMemoryServer | null = null;
let activeSource: 'atlas' | 'local' | null = null;

// Strings copied straight out of .env.example — never a real cluster.
const PLACEHOLDER_PATTERNS = [/xxxxx/i, /USER:PASSWORD/i, /<[^>]+password>/i];

const isPlaceholder = (uri: string) => PLACEHOLDER_PATTERNS.some((re) => re.test(uri));
const isProduction = () => process.env.NODE_ENV === 'production';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Decide what to connect to:
 *  - a real MONGODB_URI  -> MongoDB Atlas
 *  - missing/placeholder -> local in-memory MongoDB, but only outside production
 */
async function resolveUri(): Promise<{ uri: string; source: 'atlas' | 'local' }> {
    const uri = config.mongoUri;

    if (uri && !isPlaceholder(uri)) {
        return { uri, source: 'atlas' };
    }

    const problem = !uri
        ? 'MONGODB_URI is not set in .env'
        : 'MONGODB_URI in .env is still the example placeholder';

    if (isProduction()) {
        throw new Error(`${problem}. Refusing to fall back to a local database in production.`);
    }

    warn(`  !!  ${problem}`);
    warn('  !!  Starting a LOCAL in-memory MongoDB for development instead.');
    warn('  !!  Data is NOT persisted and NOT synced to Atlas — it dies on restart.');
    warn('  !!  Fix it: paste a real Atlas URI into .env (see .env.example / README).');

    memServer = await MongoMemoryServer.create();
    return { uri: memServer.getUri(), source: 'local' };
}

function warn(message: string) {
    console.warn('');
    console.warn(message);
}

/** Open a connection, retrying Atlas's occasional transient TLS drops. */
async function open(uri: string): Promise<MongoClient> {
    const MAX_ATTEMPTS = 4;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const candidate = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
        try {
            await candidate.connect();
            return candidate;
        } catch (err) {
            lastError = err;
            await candidate.close().catch(() => undefined);

            const reason = err instanceof Error ? err.message : String(err);
            const authFailure =
                err instanceof Error &&
                (err.name === 'MongoAuthenticationError' || /bad auth|authentication failed/i.test(reason));

            if (authFailure || attempt === MAX_ATTEMPTS) break;

            console.warn(`  !!  MongoDB connect attempt ${attempt}/${MAX_ATTEMPTS} failed — retrying…`);
            console.warn(`  !!  ${reason.split('\n')[0]}`);
            await sleep(1000 * attempt);
        }
    }

    const reason = lastError instanceof Error ? lastError.message : String(lastError ?? 'unknown error');
    throw new Error(reason);
}

function connectionHint(reason: string): string {
    return (
        `Could not connect to MongoDB Atlas: ${reason}\n` +
        '  → If the host is unknown, the URI is mistyped.\n' +
        '  → If auth failed, the password is wrong (URL-encode special characters).\n' +
        '  → If it times out, add your IP under Atlas → Network Access.'
    );
}

/** Connect to the database. Throws with an actionable message on failure. */
export async function connectDb(): Promise<Db> {
    if (db) return db;

    const { uri, source } = await resolveUri();

    try {
        client = await open(uri);
    } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);

        // Atlas unreachable (outage, IP list, network path): keep developing
        // locally instead of crashing — unless we're in production.
        if (source === 'atlas' && !isProduction()) {
            warn('  !!  MongoDB Atlas is unreachable, falling back to a LOCAL in-memory MongoDB.');
            warn(`  !!  ${reason.split('\n')[0]}`);
            warn('  !!  Your data will NOT reach Atlas until the connection is fixed.');
            memServer = await MongoMemoryServer.create();
            client = await open(memServer.getUri());
        } else {
            throw new Error(connectionHint(reason));
        }
    }

    db = client.db(config.mongoDb);
    activeSource = memServer ? 'local' : 'atlas';
    console.log(
        activeSource === 'atlas'
            ? `Connected to MongoDB Atlas -> db "${config.mongoDb}"`
            : `Connected to local in-memory MongoDB -> db "${config.mongoDb}"`
    );
    return db;
}

/** Where data is actually going right now — 'atlas' or the local fallback. */
export function dbSource(): 'atlas' | 'local' | null {
    return activeSource;
}

/** Get the live database (requires connectDb() to have resolved). */
export function getDb(): Db {
    if (!db) {
        throw new Error('Database not connected yet — connectDb() must run before serving requests.');
    }
    return db;
}

export function items(): Collection<ItemDoc> {
    return getDb().collection<ItemDoc>('items');
}

export async function closeDb(): Promise<void> {
    activeSource = null;
    if (client) {
        await client.close();
        client = null;
        db = null;
    }
    if (memServer) {
        await memServer.stop();
        memServer = null;
    }
}

export { ObjectId };
