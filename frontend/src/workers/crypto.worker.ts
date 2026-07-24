import CryptoJS from 'crypto-js';
import { deriveCryptoKeys } from '@/utils/crypto-keys';

self.onmessage = (event) => {
  const { password, salt, iterations } = event.data;

  try {
    const derivedKeys = deriveCryptoKeys(password, salt, iterations);

    self.postMessage({
      success: true,
      aesKeyHex: derivedKeys.aesKey.toString(CryptoJS.enc.Hex),
      desKeyHex: derivedKeys.desKey.toString(CryptoJS.enc.Hex),
      hmacKeyHex: derivedKeys.hmacKey.toString(CryptoJS.enc.Hex)
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred in the crypto worker.';
    self.postMessage({ success: false, error: errorMessage });
  }
};
