export type CipherType = 'AES' | 'DES' | 'none';

export type PayloadType = 'text' | 'file-header' | 'file-chunk' | 'file-cancel';

export interface FileMetadata {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  totalChunks: number;
  chunkSize: number;
  fileHash?: string;
}

export interface FileChunkMetadata {
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
}

export interface SecurePayload {
  senderDisplayName: string;
  senderSessionId?: string;
  type?: PayloadType;
  iv?: string;
  ciphertext?: string;
  plaintext?: string;
  version?: number;
  cipher: CipherType;
  hmac?: string;
  timestamp: string;
  fileMetadata?: FileMetadata;
  chunkMetadata?: FileChunkMetadata;
}
