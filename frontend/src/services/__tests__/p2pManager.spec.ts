import { describe, it, expect, vi } from 'vitest';

vi.mock('socket.io-client', () => {
  const listeners: Record<string, (...args: unknown[]) => void> = {};
  const ioListeners: Record<string, (...args: unknown[]) => void> = {};

  return {
    io: vi.fn<() => unknown>(() => ({
      on: (event: string, fn: (...args: unknown[]) => void) => {
        listeners[event] = fn;
      },
      emit: vi.fn<(...args: unknown[]) => void>(),
      disconnect: vi.fn<() => void>(),
      io: {
        on: (event: string, fn: (...args: unknown[]) => void) => {
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
      onMessageReceived: vi.fn<(...args: unknown[]) => void>(),
      onRekeyRequested: vi.fn<(...args: unknown[]) => void>(),
      onConnectionStatusChange: (status, detail) => {
        statusChanges.push(`${status}: ${detail}`);
      }
    });

    const socketInstance = (manager as unknown as { socket: { __listeners: Record<string, (...args: unknown[]) => void>; __ioListeners: Record<string, (...args: unknown[]) => void> } }).socket;
    socketInstance.__listeners['connect']?.();
    expect(statusChanges).toContain('connected: Connected to signaling server.');

    socketInstance.__listeners['disconnect']?.('transport close');
    expect(statusChanges.some((s) => s.includes('reconnecting'))).toBe(true);

    socketInstance.__ioListeners['reconnect']?.();
    expect(statusChanges.some((s) => s.includes('Reconnected'))).toBe(true);

    manager.destroy();
  });
});
