import CryptoJS from 'crypto-js';

self.onmessage = (event) => {
  const { password, salt, iterations } = event.data;

  try {
    const key128 = CryptoJS.PBKDF2(password, salt, {
      keySize: 128 / 32,
      iterations: iterations,
    });

    const key56 = CryptoJS.PBKDF2(password, salt, {
      keySize: 56 / 32,
      iterations: iterations,
    });

    self.postMessage({
      success: true,
      aesKeyHex: key128.toString(CryptoJS.enc.Hex),
      desKeyHex: key56.toString(CryptoJS.enc.Hex),
    });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown worker error',
    });
  }
};
