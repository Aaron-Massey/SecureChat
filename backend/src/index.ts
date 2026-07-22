import { createServer } from 'node:http';
import { configureSockets } from './socket.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const PORT = config.BACKEND_PORT;

const server = createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': config.CORS_ORIGIN
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