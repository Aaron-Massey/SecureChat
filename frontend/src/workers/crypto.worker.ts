import CryptoJS from 'crypto-js';


self.onmessage = (event) => {
  const { password, salt } = event.data;

  try {

    const derivedAES = CryptoJS.PBKDF2(password, salt, {
      keySize: 128 / 32,
      iterations: 100000,
      hasher: CryptoJS.algo.SHA256
    });
    const aesKeyHex = derivedAES.toString(CryptoJS.enc.Hex);


    const derivedDES = CryptoJS.PBKDF2(password, salt, {
      keySize: 64 / 32,
      iterations: 100000,
      hasher: CryptoJS.algo.SHA256
    });
    const desKeyHex = derivedDES.toString(CryptoJS.enc.Hex);

    self.postMessage({ success: true, aesKeyHex, desKeyHex });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred in the crypto worker.';
    self.postMessage({ success: false, error: errorMessage });
  }
};
