import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useP2P } from '../useP2P';
import { useCryptoStore } from '@/stores/crypto';

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

if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = vi.fn<() => string>(() => 'blob:http://localhost/dummy-file');
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = vi.fn<() => void>();
}

describe('useP2P File Transfer & Key Verification', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('marks file as decrypted when keys match and decryption succeeds', () => {
    const cryptoStore = useCryptoStore();
    cryptoStore.setupKeys('secret-passphrase');

    const { sendP2PMessage, chatHistory } = useP2P();
    expect(chatHistory.value).toEqual([]);

    sendP2PMessage('Hello World', 'Alice');
    expect(chatHistory.value.length).toBe(1);
    expect(chatHistory.value[0]!.text).toBe('Hello World');
    expect(chatHistory.value[0]!.decrypted).toBe(true);
  });

  it('handles encrypted file transfer complete callback with valid key', () => {
    const cryptoStore = useCryptoStore();
    cryptoStore.setupKeys('shared-passphrase');

    const { chatHistory } = useP2P();

    const chunkPlaintext = 'SGVsbG8gV29ybGQ=';
    const encryptedChunk = cryptoStore.encryptMessage(chunkPlaintext, 'Bob');
    encryptedChunk.cipher = 'AES';
    encryptedChunk.type = 'file-chunk';
    encryptedChunk.chunkMetadata = {
      fileId: 'file-123',
      chunkIndex: 0,
      totalChunks: 1
    };

    chatHistory.value.push({
      id: 'file-123',
      sender: 'Bob',
      decrypted: true,
      timestamp: '12:00:00 PM',
      fileAttachment: {
        fileId: 'file-123',
        fileName: 'test.txt',
        fileSize: 11,
        mimeType: 'text/plain',
        progress: 0,
        isTransferring: true
      }
    });

    const msg = chatHistory.value.find(m => m.fileAttachment?.fileId === 'file-123');
    expect(msg).toBeDefined();
    expect(msg?.fileAttachment?.isTransferring).toBe(true);
  });

  it('flags key verification failure when receiving encrypted file chunk with wrong passphrase', () => {
    const cryptoStoreSender = useCryptoStore();
    cryptoStoreSender.setupKeys('correct-passphrase');
    const encryptedChunk = cryptoStoreSender.encryptMessage('SGVsbG8=', 'Bob');
    encryptedChunk.cipher = 'AES';
    encryptedChunk.type = 'file-chunk';
    encryptedChunk.chunkMetadata = {
      fileId: 'file-456',
      chunkIndex: 0,
      totalChunks: 1
    };

    const cryptoStoreReceiver = useCryptoStore();
    cryptoStoreReceiver.setupKeys('wrong-passphrase');

    const result = cryptoStoreReceiver.decryptMessage(encryptedChunk);
    expect(result.success).toBe(false);
  });

  it('counts a file transfer as exactly 1 message in the rate limiter quota', async () => {
    const { sendP2PFile, quotaUsed } = useP2P();
    expect(quotaUsed.value).toBe(0);

    const dummyFile = new File(['a'.repeat(100000)], 'large-file.bin', { type: 'application/octet-stream' });
    await sendP2PFile(dummyFile, 'Alice');

    expect(quotaUsed.value).toBe(1);
  });
});
