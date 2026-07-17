import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { SecurePayload } from '../../../shared/types/payload';
import CryptoJS from 'crypto-js';

export const useCryptoStore = defineStore('crypto', () => {
  const activeBitLength = ref<128 | 56>(128);
  const isReady = ref(false);
  let sharedKey: CryptoJS.lib.WordArray | null = null;

  const setupKeys = (password: string) => {
    if (!password || password.trim().length === 0) {
      isReady.value = false;
      sharedKey = null;
      return;
    }
    sharedKey = CryptoJS.enc.Utf8.parse(password);
    isReady.value = true;
  };

  const encryptMessage = (
    plaintext: string,
    senderDisplayName: string
  ): SecurePayload => {
    if (!isReady.value || !sharedKey) {
      throw new Error('Crypto store not ready. Call setupKeys first.');
    }

    const cipher = activeBitLength.value === 128 ? 'AES' : 'DES';
    const iv = CryptoJS.lib.WordArray.random(16);
    const ivHex = iv.toString();

    let ciphertext: CryptoJS.lib.CipherParams;

    if (cipher === 'AES') {
      ciphertext = CryptoJS.AES.encrypt(plaintext, sharedKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
    } else {
      ciphertext = CryptoJS.DES.encrypt(plaintext, sharedKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
    }

    const ciphertextHex = ciphertext.toString();
    const hmac = CryptoJS.HmacSHA256(ciphertextHex, CryptoJS.enc.Utf8.parse(sharedKey.toString())).toString();

    return {
      senderDisplayName,
      iv: ivHex,
      ciphertext: ciphertextHex,
      version: 1,
      cipher,
      hmac,
      timestamp: new Date().toISOString()
    };
  };

  const decryptMessage = (
    payload: SecurePayload
  ): { success: boolean; plaintext: string; senderDisplayName: string } => {
    if (!isReady.value || !sharedKey) {
      return {
        success: false,
        plaintext: 'Crypto store not ready',
        senderDisplayName: payload.senderDisplayName
      };
    }

    try {
      if (!payload.ciphertext || !payload.iv) {
        return {
          success: false,
          plaintext: 'Missing ciphertext or IV',
          senderDisplayName: payload.senderDisplayName
        };
      }

      if (payload.hmac) {
        const calculatedHmac = CryptoJS.HmacSHA256(payload.ciphertext, CryptoJS.enc.Utf8.parse(sharedKey.toString())).toString();
        if (calculatedHmac !== payload.hmac) {
          return {
            success: false,
            plaintext: 'HMAC verification failed',
            senderDisplayName: payload.senderDisplayName
          };
        }
      }

      const iv = CryptoJS.enc.Hex.parse(payload.iv);
      let plaintext: string;

      if (payload.cipher === 'AES') {
        const decrypted = CryptoJS.AES.decrypt(payload.ciphertext, sharedKey, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });
        plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      } else if (payload.cipher === 'DES') {
        const decrypted = CryptoJS.DES.decrypt(payload.ciphertext, sharedKey, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });
        plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      } else {
        return {
          success: false,
          plaintext: 'Unknown cipher',
          senderDisplayName: payload.senderDisplayName
        };
      }

      if (!plaintext) {
        return {
          success: false,
          plaintext: 'Decryption failed',
          senderDisplayName: payload.senderDisplayName
        };
      }

      return {
        success: true,
        plaintext,
        senderDisplayName: payload.senderDisplayName
      };
    } catch (error) {
      console.error('Decryption error:', error);
      return {
        success: false,
        plaintext: 'Decryption error',
        senderDisplayName: payload.senderDisplayName
      };
    }
  };

  return {
    activeBitLength,
    isReady,
    setupKeys,
    encryptMessage,
    decryptMessage
  };
});
