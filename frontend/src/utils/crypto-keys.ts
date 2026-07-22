import CryptoJS from 'crypto-js';

export interface DerivedCryptoKeys {
  aesKey: CryptoJS.lib.WordArray;
  desKey: CryptoJS.lib.WordArray;
  hmacKey: CryptoJS.lib.WordArray;
}

export const deriveCryptoKeys = (
  password: string,
  salt: string,
  iterations: number
): DerivedCryptoKeys => {
  const options = {
    iterations,
    hasher: CryptoJS.algo.SHA256
  };

  return {
    aesKey: CryptoJS.PBKDF2(password, `${salt}:aes`, {
      keySize: 128 / 32,
      ...options
    }),
    desKey: CryptoJS.PBKDF2(password, `${salt}:des`, {
      keySize: 64 / 32,
      ...options
    }),
    hmacKey: CryptoJS.PBKDF2(password, `${salt}:hmac`, {
      keySize: 256 / 32,
      ...options
    })
  };
};

export const getIvLength = (cipher: 'AES' | 'DES') => (cipher === 'AES' ? 16 : 8);
