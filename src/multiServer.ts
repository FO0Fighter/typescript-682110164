import express from 'express';
import path from 'path';

// Two ports, one process. Override with PORT1 / PORT2 if 3000/3001 are taken.
const port1 = Number(process.env.PORT1) || 3000;
const port2 = Number(process.env.PORT2) || 3001;
const publicDir = path.join(__dirname, '..', 'public');

// Port 1 — JSON API server.
const api = express();
api.use(express.json());

api.get('/', (_req, res) => {
    res.json({ server: 'api', port: port1, status: 'running' });
});

api.get('/api/health', (_req, res) => {
    res.json({ ok: true, uptime: process.uptime() });
});

// Port 2 — static file server (serves public/).
const web = express();
web.use(express.static(publicDir));

web.get('/api/health', (_req, res) => {
    res.json({ ok: true, server: 'web', port: port2 });
});

const servers = [api.listen(port1), web.listen(port2)];

servers[0].on('listening', () => console.log(`API  server  -> http://localhost:${port1}`));
servers[1].on('listening', () => console.log(`Web  server  -> http://localhost:${port2}`));
servers.forEach((s, i) => s.on('error', (err: NodeJS.ErrnoException) => {
    console.error(`Port ${i === 0 ? port1 : port2} failed:`, err.code === 'EADDRINUSE' ? 'already in use' : err.message);
    process.exit(1);
}));

const shutdown = (signal: string) => {
    console.log(`\n${signal} received, closing both servers...`);
    Promise.all(servers.map((s) => new Promise<void>((resolve) => s.close(() => resolve())))).then(() => {
        process.exit(0);
    });
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
