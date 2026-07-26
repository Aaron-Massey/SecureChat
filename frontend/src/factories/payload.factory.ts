import type { SecurePayload, FileMetadata, FileChunkMetadata } from '@shared/types/payload';

/**
 * Factory Method Pattern: PayloadFactory
 * Constructs message, file header, and file chunk payloads.
 */
export class PayloadFactory {
  /**
   * Creates an unencrypted text SecurePayload.
   */
  public static createTextPayload(
    senderDisplayName: string,
    plaintext: string,
    timestamp: string = new Date().toLocaleTimeString(),
    senderSessionId?: string
  ): SecurePayload {
    return {
      senderDisplayName,
      senderSessionId,
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
    timestamp: string = new Date().toLocaleTimeString(),
    senderSessionId?: string
  ): SecurePayload {
    if (encryptedHeaderPayload) {
      return {
        ...encryptedHeaderPayload,
        senderSessionId: senderSessionId || encryptedHeaderPayload.senderSessionId,
        type: 'file-header',
        fileMetadata,
        timestamp
      };
    }

    return {
      senderDisplayName,
      senderSessionId,
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
    chunkMetadata: FileChunkMetadata,
    encryptedChunkPayload?: SecurePayload,
    base64PlaintextChunk?: string,
    timestamp: string = new Date().toLocaleTimeString(),
    senderSessionId?: string
  ): SecurePayload {
    if (encryptedChunkPayload) {
      return {
        ...encryptedChunkPayload,
        senderSessionId: senderSessionId || encryptedChunkPayload.senderSessionId,
        type: 'file-chunk',
        chunkMetadata,
        timestamp
      };
    }

    return {
      senderDisplayName,
      senderSessionId,
      plaintext: base64PlaintextChunk || '',
      cipher: 'none',
      type: 'file-chunk',
      chunkMetadata,
      timestamp
    };
  }
}
