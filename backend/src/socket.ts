import { Server as HttpServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../config.json'), 'utf-8'));

export function configureSockets(server: HttpServer) {
    const io = new Server(server, {
        cors: { origin: config.CORS_ORIGIN, methods: ['GET', 'POST'] }
    });

    io.on('connection', (socket: Socket) => {
        socket.on('webrtc-offer', (offer: RTCSessionDescriptionInit) => socket.broadcast.emit('webrtc-offer', offer));
        socket.on('webrtc-answer', (answer: RTCSessionDescriptionInit) => socket.broadcast.emit('webrtc-answer', answer));
        socket.on('new-ice-candidate', (candidate: RTCIceCandidateInit) => socket.broadcast.emit('new-ice-candidate', candidate));
    });
}