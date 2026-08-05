import { describe, it, expect, vi } from 'vitest';
import type { SecurePayload } from '@shared/types/payload';

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

describe('P2PManager Fail-Fast Verification', () => {
  it('drops incoming chunks when a file transfer is marked as rejected', () => {
    const onChunkReceived = vi.fn<(...args: unknown[]) => void>();
    const manager = new P2PManager('http://localhost:3000', {
      onMessageReceived: vi.fn<(...args: unknown[]) => void>(),
      onRekeyRequested: vi.fn<(...args: unknown[]) => void>(),
      onFileChunkReceived: onChunkReceived
    });

    const fileId = 'file-test-123';
    const headerPayload: SecurePayload = {
      senderDisplayName: 'Alice',
      type: 'file-header',
      cipher: 'AES',
      timestamp: '12:00',
      fileMetadata: {
        fileId,
        fileName: 'test.png',
        fileSize: 128000,
        mimeType: 'image/png',
        totalChunks: 2,
        chunkSize: 64000
      }
    };

    // Simulate header arrival
    (manager as unknown as { handleIncomingFileHeader: (p: SecurePayload) => void }).handleIncomingFileHeader(headerPayload);

    // Reject file transfer (Fail-Fast)
    manager.rejectFileTransfer(fileId);
    expect(manager.isRejectedFile(fileId)).toBe(true);

    // Simulate chunk arrival after rejection
    const chunkPayload: SecurePayload = {
      senderDisplayName: 'Alice',
      type: 'file-chunk',
      cipher: 'AES',
      timestamp: '12:00',
      chunkMetadata: {
        fileId,
        chunkIndex: 0,
        totalChunks: 2
      }
    };

    (manager as unknown as { handleIncomingFileChunk: (p: SecurePayload) => void }).handleIncomingFileChunk(chunkPayload);

    // Verify chunk callback was NOT called (chunk dropped immediately)
    expect(onChunkReceived).not.toHaveBeenCalled();

    manager.destroy();
  });

  it('triggers onFileTransferCancelled when receiving a file-cancel payload', () => {
    const onCancelled = vi.fn<(...args: unknown[]) => void>();
    const manager = new P2PManager('http://localhost:3000', {
      onMessageReceived: vi.fn<(...args: unknown[]) => void>(),
      onRekeyRequested: vi.fn<(...args: unknown[]) => void>(),
      onFileTransferCancelled: onCancelled
    });

    const fileId = 'file-cancel-456';
    const cancelPayload: SecurePayload = {
      senderDisplayName: 'Bob',
      senderSessionId: 'peer-bob',
      type: 'file-cancel',
      plaintext: 'Key verification failed',
      cipher: 'none',
      timestamp: '12:01',
      fileMetadata: {
        fileId,
        fileName: '',
        fileSize: 0,
        mimeType: '',
        totalChunks: 0,
        chunkSize: 0
      }
    };

    (manager as unknown as { handleIncomingFileCancel: (p: SecurePayload) => void }).handleIncomingFileCancel(cancelPayload);

    expect(manager.isCancelledFile(fileId)).toBe(true);
    expect(manager.isCancelledByPeer(fileId, 'peer-bob')).toBe(true);
    expect(onCancelled).toHaveBeenCalledWith(fileId, 'Key verification failed');

    manager.destroy();
  });
});
