import type { SecurePayload, FileMetadata, ChunkMetadata } from '@shared/types/payload';

/**
 * Factory Method / Abstract Factory Pattern: PayloadFactory
 * Encapsulates standard creation of SecurePayload objects for text messages,
 * file headers, and file chunks.
 */
export class PayloadFactory {
  /**
   * Creates an unencrypted text SecurePayload.
   */
  public static createTextPayload(
    senderDisplayName: string,
    plaintext: string,
    timestamp: string = new Date().toLocaleTimeString()
  ): SecurePayload {
    return {
      senderDisplayName,
      plaintext,
      cipher: 'none',
      type: 'text',
      timestamp
    };
  }

  /**
   * Creates a file header SecurePayload.
   */
  public static createFileHeaderPayload(
    senderDisplayName: string,
    fileMetadata: FileMetadata,
    encryptedHeaderPayload?: SecurePayload,
    timestamp: string = new Date().toLocaleTimeString()
  ): SecurePayload {
    if (encryptedHeaderPayload) {
      return {
        ...encryptedHeaderPayload,
        type: 'file-header',
        fileMetadata,
        timestamp
      };
    }

    return {
      senderDisplayName,
      plaintext: `FILE:${fileMetadata.fileName}`,
      cipher: 'none',
      type: 'file-header',
      fileMetadata,
      timestamp
    };
  }

  /**
   * Creates a file chunk SecurePayload.
   */
  public static createFileChunkPayload(
    senderDisplayName: string,
    chunkMetadata: ChunkMetadata,
    encryptedChunkPayload?: SecurePayload,
    base64PlaintextChunk?: string,
    timestamp: string = new Date().toLocaleTimeString()
  ): SecurePayload {
    if (encryptedChunkPayload) {
      return {
        ...encryptedChunkPayload,
        type: 'file-chunk',
        chunkMetadata,
        timestamp
      };
    }

    return {
      senderDisplayName,
      plaintext: base64PlaintextChunk || '',
      cipher: 'none',
      type: 'file-chunk',
      chunkMetadata,
      timestamp
    };
  }
}
