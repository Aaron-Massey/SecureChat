import { Server as HttpServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../config.json'), 'utf-8'));

const ROOM_NAME = 'secure-chat-room';


const getRandomRekeyInterval = () => {
    const min = 1 * 60 * 1000;
    const max = 3 * 60 * 1000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export function configureSockets(server: HttpServer) {
    const io = new Server(server, {
        cors: {
            origin: config.CORS_ORIGIN,
            methods: ['GET', 'POST']
        }
    });

    let rekeyTimeout: NodeJS.Timeout;

    const scheduleRekey = () => {
        if (rekeyTimeout) {
            clearTimeout(rekeyTimeout);
        }

        rekeyTimeout = setTimeout(() => {
            console.log('Broadcasting rekey event to all clients.');
            io.to(ROOM_NAME).emit('rekey');
            scheduleRekey();
        }, getRandomRekeyInterval());
    };

    io.on('connection', (socket: Socket) => {
        console.log(`Client ${socket.id} connected.`);
        socket.join(ROOM_NAME);

        if (io.sockets.adapter.rooms.get(ROOM_NAME)?.size === 1) {
            console.log('First client connected, starting rekey timer.');
            scheduleRekey();
        }

        const otherClients = Array.from(io.sockets.adapter.rooms.get(ROOM_NAME) || [])
            .filter(id => id !== socket.id);
        socket.emit('other-clients', otherClients);

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
            console.log(`Client ${socket.id} disconnected.`);
            socket.to(ROOM_NAME).emit('client-disconnected', socket.id);

            if (!io.sockets.adapter.rooms.get(ROOM_NAME)?.size) {
                console.log('Last client disconnected, stopping rekey timer.');
                clearTimeout(rekeyTimeout);
            }
        });
    });
}