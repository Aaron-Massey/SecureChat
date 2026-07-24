import { describe, it, expect, vi } from 'vitest';

vi.mock('socket.io-client', () => {
  const listeners: Record<string, Function> = {};
  const ioListeners: Record<string, Function> = {};

  return {
    io: vi.fn(() => ({
      on: (event: string, fn: Function) => {
        listeners[event] = fn;
      },
      emit: vi.fn(),
      disconnect: vi.fn(),
      io: {
        on: (event: string, fn: Function) => {
          ioListeners[event] = fn;
        }
      },
      __listeners: listeners,
      __ioListeners: ioListeners
    }))
  };
});

import { P2PManager } from '../p2pManager';

describe('P2PManager Auto-Reconnect', () => {
  it('triggers connection status callbacks on socket lifecycle events', () => {
    const statusChanges: string[] = [];
    const manager = new P2PManager('http://localhost:3000', {
      onMessageReceived: vi.fn(),
      onRekeyRequested: vi.fn(),
      onConnectionStatusChange: (status, detail) => {
        statusChanges.push(`${status}: ${detail}`);
      }
    });

    const socketInstance = (manager as any).socket;
    socketInstance.__listeners['connect']();
    expect(statusChanges).toContain('connected: Connected to signaling server.');

    socketInstance.__listeners['disconnect']('transport close');
    expect(statusChanges.some((s) => s.includes('reconnecting'))).toBe(true);

    socketInstance.__ioListeners['reconnect']();
    expect(statusChanges.some((s) => s.includes('Reconnected'))).toBe(true);

    manager.destroy();
  });
});
