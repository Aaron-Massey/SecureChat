export type CipherType = 'AES' | 'DES' | 'none';

export interface SecurePayload {
    senderDisplayName: string;
    iv?: string;
    ciphertext?: string;
    plaintext?: string;
    version?: number;
    cipher: CipherType;
    hmac?: string;
    timestamp: string;
}