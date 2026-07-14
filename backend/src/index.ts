import { createServer } from 'node:http';
import { configureSockets } from './socket.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../config.json'), 'utf-8'));
const PORT = process.env.PORT || config.BACKEND_PORT;

const server = createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
        status: 'success',
        message: 'SecureChat Signaling Server is active.'
    }));
});

configureSockets(server);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Signaling Server running: Listening on http://0.0.0.0:${PORT}`);
});