import path from 'path';

// Load .env without adding a dependency (Node >= 20.12).
// A missing .env is fine — the host may provide the variables instead.
try {
    process.loadEnvFile(path.join(process.cwd(), '.env'));
} catch {
    // no .env file
}

// PORT=0 / PORT="" / PORT=abc would otherwise silently bind a random port.
const rawPort = Number(process.env.PORT);
const port = Number.isInteger(rawPort) && rawPort >= 1 && rawPort <= 65535 ? rawPort : 3000;

export const config = {
    port,
    mongoUri: process.env.MONGODB_URI ?? '',
    mongoDb: process.env.MONGODB_DB ?? 'freebuff',
};
