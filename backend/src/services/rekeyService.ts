import { Server } from 'socket.io';

export interface RekeyServiceOptions {
  minMinutes?: number;
  maxMinutes?: number;
}

export class RekeyService {
  private rekeyTimeout: NodeJS.Timeout | null = null;
  private minMs: number;
  private maxMs: number;

  constructor(options: RekeyServiceOptions = {}) {
    const minMinutes = options.minMinutes ?? 1;
    const maxMinutes = options.maxMinutes ?? 3;
    this.minMs = minMinutes * 60 * 1000;
    this.maxMs = maxMinutes * 60 * 1000;
  }

  private getRandomInterval(): number {
    return Math.floor(Math.random() * (this.maxMs - this.minMs + 1)) + this.minMs;
  }

  public start(io: Server, roomName: string): void {
    this.stop();
    const interval = this.getRandomInterval();
    this.rekeyTimeout = setTimeout(() => {
      console.log('Broadcasting rekey event to all clients.');
      io.to(roomName).emit('rekey');
      this.start(io, roomName);
    }, interval);
  }

  public stop(): void {
    if (this.rekeyTimeout) {
      clearTimeout(this.rekeyTimeout);
      this.rekeyTimeout = null;
    }
  }

  public isRunning(): boolean {
    return this.rekeyTimeout !== null;
  }
}
