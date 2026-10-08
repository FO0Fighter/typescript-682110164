import express from 'express';
import path from 'path';
import { config } from './config';
import { connectDb, closeDb, items } from './db';

const app = express();
const publicDir = path.join(__dirname, '..', 'public');

app.use(express.json());
app.use(express.static(publicDir));

// Two routes — that's all the glue the page needs. A browser cannot talk to
// Atlas on its own (the driver and the credentials live server-side), so this
// is the minimum proxy between the frontend and MongoDB.
app.get('/api/items', async (_req, res) => {
    const docs = await items().find().sort({ createdAt: -1 }).toArray();
    res.json(docs.map((d) => ({ id: d._id?.toString(), text: d.text })));
});

app.post('/api/items', async (req, res) => {
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!text) {
        res.status(400).json({ error: 'text is required' });
        return;
    }
    const result = await items().insertOne({ text, createdAt: new Date() });
    res.status(201).json({ id: result.insertedId.toString(), text });
});

async function main() {
    await connectDb();

    const server = app.listen(config.port, () => {
        const addr = server.address();
        const actualPort = typeof addr === 'object' && addr ? addr.port : config.port;
        console.log(`Server is running at http://localhost:${actualPort}`);
    });

    const shutdown = async (signal: string) => {
        console.log(`\n${signal} received, shutting down...`);
        server.close(async () => {
            await closeDb();
            process.exit(0);
        });
    };
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err: unknown) => {
    console.error('Failed to start server:', err instanceof Error ? err.message : err);
    process.exit(1);
});
