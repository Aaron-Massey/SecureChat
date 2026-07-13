import { Server as HttpServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../config.json'), 'utf-8'));

const ROOM_NAME = 'secure-chat-room';

export function configureSockets(server: HttpServer) {
    const io = new Server(server, {
        cors: { origin: config.CORS_ORIGIN, methods: ['GET', 'POST'] }
    });

    io.on('connection', (socket: Socket) => {
        // Join a room
        socket.join(ROOM_NAME);

        // Get other clients in the room and send to the new client
        const otherClients = Array.from(io.sockets.adapter.rooms.get(ROOM_NAME) || [])
            .filter(id => id !== socket.id);
        socket.emit('other-clients', otherClients);

        // Notify other clients of the new arrival
        socket.to(ROOM_NAME).emit('new-client', socket.id);

        socket.on('webrtc-offer', ({ recipientId, payload }) => {
            socket.to(recipientId).emit('webrtc-offer', { senderId: socket.id, payload });
        });

        socket.on('webrtc-answer', ({ recipientId, payload }) => {
            socket.to(recipientId).emit('webrtc-answer', { senderId: socket.id, payload });
        });

        socket.on('new-ice-candidate', ({ recipientId, payload }) => {
            socket.to(recipientId).emit('new-ice-candidate', { senderId: socket.id, payload });
        });

        socket.on('disconnect', () => {
            socket.to(ROOM_NAME).emit('client-disconnected', socket.id);
        });
    });
}