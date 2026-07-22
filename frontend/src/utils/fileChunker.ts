import CryptoJS from 'crypto-js';

export const DEFAULT_CHUNK_SIZE = 64 * 1024; // 64 KB
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export interface FileChunk {
  chunkIndex: number;
  totalChunks: number;
  data: ArrayBuffer;
}

/**
 * Splits a browser File into ArrayBuffer chunks.
 */
export const sliceFileIntoChunks = async (
  file: File,
  chunkSize: number = DEFAULT_CHUNK_SIZE
): Promise<ArrayBuffer[]> => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)} MB.`);
  }

  const chunks: ArrayBuffer[] = [];
  let offset = 0;

  while (offset < file.size) {
    const blobSlice = file.slice(offset, offset + chunkSize);
    const buffer = await blobSlice.arrayBuffer();
    chunks.push(buffer);
    offset += chunkSize;
  }

  return chunks;
};

/**
 * Converts an ArrayBuffer to a Base64 string.
 */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary);
};


/**
 * Converts a Base64 string back into an ArrayBuffer.
 */
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Computes a SHA-256 hash string for an ArrayBuffer or WordArray using CryptoJS.
 */
export const computeBufferHash = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const wordArray = CryptoJS.lib.WordArray.create(bytes as any);
  return CryptoJS.SHA256(wordArray).toString();
};

/**
 * Recombines array of ArrayBuffers into a single Blob and returns an Object URL.
 */
export const createObjectUrlFromBuffers = (
  buffers: ArrayBuffer[],
  mimeType: string
): string => {
  const blob = new Blob(buffers, { type: mimeType });
  return URL.createObjectURL(blob);
};

/**
 * Revokes an object URL to free browser memory.
 */
export const revokeObjectUrl = (url: string): void => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Format bytes to human readable string (e.g. 1.5 MB).
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
