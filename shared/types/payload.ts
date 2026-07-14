export interface SecurePayload {
    senderDisplayName: string;
    iv?: string;
    ciphertext?: string;
    plaintext?: string;
    version?: number;
    cipher: 'AES' | 'DES' | 'none';
    hmac?: string;
}