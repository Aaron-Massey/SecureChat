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
    const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    console.log(`[SOCKET CONNECT] Client ${socket.id} connected from IP: ${clientIp}`);
    socket.join(ROOM_NAME);

    const roomClients = Array.from(io.sockets.adapter.rooms.get(ROOM_NAME) || []);
    console.log(`[ROOM STATUS] Active room clients (${roomClients.length}): [${roomClients.join(', ')}]`);

    if (roomClients.length === 1) {
      console.log('[REKEY TIMER] First client connected, starting rekey timer.');
      rekeyService.start(io, ROOM_NAME);
    }

    const otherClients = roomClients.filter(id => id !== socket.id);
    console.log(`[SIGNALING] Emitting 'other-clients' to ${socket.id}: [${otherClients.join(', ')}]`);
    socket.emit('other-clients', otherClients);

    console.log(`[SIGNALING] Broadcasting 'new-client' event for ${socket.id} to room`);
    socket.to(ROOM_NAME).emit('new-client', socket.id);

    socket.on('webrtc-offer', ({ recipientId, payload }) => {
      console.log(`[WEBRTC OFFER] ${socket.id} ---> ${recipientId} (type: ${payload?.type})`);
      socket.to(recipientId).emit('webrtc-offer', { senderId: socket.id, payload });
    });

    socket.on('webrtc-answer', ({ recipientId, payload }) => {
      console.log(`[WEBRTC ANSWER] ${socket.id} ---> ${recipientId} (type: ${payload?.type})`);
      socket.to(recipientId).emit('webrtc-answer', { senderId: socket.id, payload });
    });

    socket.on('new-ice-candidate', ({ recipientId, payload }) => {
      const candidateStr = payload?.candidate || '';
      const candidateType = candidateStr.includes('typ host')
        ? 'HOST (LAN)'
        : candidateStr.includes('typ srflx')
        ? 'STUN (Public IP)'
        : candidateStr.includes('typ relay')
        ? 'TURN (Relay)'
        : 'UNKNOWN';
      console.log(`[ICE CANDIDATE] ${socket.id} ---> ${recipientId} [Candidate Type: ${candidateType}]`);
      socket.to(recipientId).emit('new-ice-candidate', { senderId: socket.id, payload });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[SOCKET DISCONNECT] Client ${socket.id} disconnected (reason: ${reason})`);
      socket.to(ROOM_NAME).emit('client-disconnected', socket.id);

      const remainingClients = Array.from(io.sockets.adapter.rooms.get(ROOM_NAME) || []);
      console.log(`[ROOM STATUS] Remaining clients (${remainingClients.length}): [${remainingClients.join(', ')}]`);

      if (remainingClients.length === 0) {
        console.log('[REKEY TIMER] Last client disconnected, stopping rekey timer.');
        rekeyService.stop();
      }
    });
  });

  return io;
}