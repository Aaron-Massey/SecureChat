import { Server as HttpServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import { loadConfig } from './config.js';
import { RekeyService } from './services/rekeyService.js';

export const ROOM_NAME = 'secure-chat-room';

export function configureSockets(server: HttpServer): Server {
  const config = loadConfig();
  const io = new Server(server, {
    cors: {
      origin: config.CORS_ORIGIN,
      methods: ['GET', 'POST']
    }
  });

  const rekeyService = new RekeyService();

  io.on('connection', (socket: Socket) => {
    console.log(`Client ${socket.id} connected.`);
    socket.join(ROOM_NAME);

    const roomSize = io.sockets.adapter.rooms.get(ROOM_NAME)?.size ?? 0;
    if (roomSize === 1) {
      console.log('First client connected, starting rekey timer.');
      rekeyService.start(io, ROOM_NAME);
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

      const currentRoomSize = io.sockets.adapter.rooms.get(ROOM_NAME)?.size ?? 0;
      if (currentRoomSize === 0) {
        console.log('Last client disconnected, stopping rekey timer.');
        rekeyService.stop();
      }
    });
  });

  return io;
}