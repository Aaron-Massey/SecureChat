export interface SecurePayload {
    iv: string;
    ciphertext: string;
    version: number;
    cipher: 'AES' | 'DES';
}