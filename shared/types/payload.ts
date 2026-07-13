export interface SecurePayload {
    senderDisplayName: string;
    iv: string;
    ciphertext: string;
    version: number;
    cipher: 'AES' | 'DES';
    hmac?: string;
}