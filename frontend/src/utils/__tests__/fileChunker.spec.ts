import { describe, it, expect, vi } from 'vitest';
import {
  sliceFileIntoChunks,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  computeBufferHash,
  formatFileSize,
  createObjectUrlFromBuffers,
  revokeObjectUrl,
  MAX_FILE_SIZE
} from '../fileChunker';

describe('fileChunker utility', () => {
  it('converts ArrayBuffer to Base64 and back correctly', () => {
    const text = 'Hello, SecureChat P2P file sharing!';
    const encoder = new TextEncoder();
    const originalBuffer = encoder.encode(text).buffer;

    const base64 = arrayBufferToBase64(originalBuffer);
    expect(typeof base64).toBe('string');
    expect(base64.length).toBeGreaterThan(0);

    const reconstructedBuffer = base64ToArrayBuffer(base64);
    const decoder = new TextDecoder();
    const reconstructedText = decoder.decode(reconstructedBuffer);

    expect(reconstructedText).toBe(text);
  });

  it('formats file sizes accurately', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(1500)).toBe('1.5 KB');
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });

  it('slices a file into expected chunk sizes', async () => {
    const dummyContent = new Uint8Array(100 * 1024); // 100 KB
    for (let i = 0; i < dummyContent.length; i++) {
      dummyContent[i] = i % 256;
    }
    const file = new File([dummyContent], 'test.dat', { type: 'application/octet-stream' });

    const chunkSize = 32 * 1024; // 32 KB
    const chunks = await sliceFileIntoChunks(file, chunkSize);

    expect(chunks.length).toBe(4); // 32KB + 32KB + 32KB + 4KB
    expect(chunks[0]!.byteLength).toBe(32 * 1024);
    expect(chunks[3]!.byteLength).toBe(4 * 1024);
  });

  it('throws an error if file size exceeds MAX_FILE_SIZE', async () => {
    const oversizedFile = {
      size: MAX_FILE_SIZE + 1024,
      slice: vi.fn()
    } as unknown as File;

    await expect(sliceFileIntoChunks(oversizedFile)).rejects.toThrow(/exceeds maximum allowed size/);
  });

  it('computes hash deterministically for same buffer content', () => {
    const encoder = new TextEncoder();
    const buffer1 = encoder.encode('SecureChat File Payload').buffer;
    const buffer2 = encoder.encode('SecureChat File Payload').buffer;
    const buffer3 = encoder.encode('Different Content').buffer;

    const hash1 = computeBufferHash(buffer1);
    const hash2 = computeBufferHash(buffer2);
    const hash3 = computeBufferHash(buffer3);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  it('creates and revokes Object URLs', () => {
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/dummy-id');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const buffer = new TextEncoder().encode('Test Blob').buffer;
    const url = createObjectUrlFromBuffers([buffer], 'text/plain');

    expect(createSpy).toHaveBeenCalled();
    expect(url).toBe('blob:http://localhost/dummy-id');

    revokeObjectUrl(url);
    expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/dummy-id');

    createSpy.mockRestore();
    revokeSpy.mockRestore();
  });
});
