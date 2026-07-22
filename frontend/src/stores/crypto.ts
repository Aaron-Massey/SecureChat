import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { SecurePayload } from '@shared/types/payload';
import CryptoJS from 'crypto-js';
import { getCryptoDerivationSettings } from '@/config/crypto';
import { deriveCryptoKeys } from '@/utils/crypto-keys';
import { CipherFactory } from '@/crypto/cipher.strategy';

export interface DecryptResult {
  success: boolean;
  plaintext: string;
  senderDisplayName: string;
}

export const useCryptoStore = defineStore('crypto', () => {
  const activeBitLength = ref<128 | 56>(128);
  const isReady = ref(false);
  const isEncrypted = computed(() => isReady.value);
  let lastPassword: string | null = null;
  let sharedKeys: ReturnType<typeof deriveCryptoKeys> | null = null;

  const setupKeys = (password: string): void => {
    if (!password || password.trim().length === 0) {
      isReady.value = false;
      lastPassword = null;
      sharedKeys = null;
      return;
    }

    const { salt, iterations } = getCryptoDerivationSettings();
    sharedKeys = deriveCryptoKeys(password, salt, iterations);
    lastPassword = password;
    isReady.value = true;
  };

  const encryptMessage = (
    plaintext: string,
    senderDisplayName: string
  ): SecurePayload => {
    if (!isReady.value || !sharedKeys) {
      throw new Error('Crypto store not ready. Call setupKeys first.');
    }

    const strategy = CipherFactory.getStrategyByBitLength(activeBitLength.value);
    const iv = CryptoJS.lib.WordArray.random(strategy.ivByteLength);
    const ivHex = iv.toString();

    const key = strategy.cipherName === 'AES' ? sharedKeys.aesKey : sharedKeys.desKey;
    const ciphertextHex = strategy.encrypt(plaintext, key, iv);
    const hmac = CryptoJS.HmacSHA256(ciphertextHex, sharedKeys.hmacKey).toString();

    return {
      senderDisplayName,
      iv: ivHex,
      ciphertext: ciphertextHex,
      version: 1,
      cipher: strategy.cipherName,
      hmac,
      timestamp: new Date().toISOString()
    };
  };

  const decryptMessage = (payload: SecurePayload): DecryptResult => {
    if (!isReady.value || !sharedKeys) {
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
        const calculatedHmac = CryptoJS.HmacSHA256(payload.ciphertext, sharedKeys.hmacKey).toString();
        if (calculatedHmac !== payload.hmac) {
          return {
            success: false,
            plaintext: 'HMAC verification failed',
            senderDisplayName: payload.senderDisplayName
          };
        }
      }

      if (payload.cipher !== 'AES' && payload.cipher !== 'DES') {
        return {
          success: false,
          plaintext: 'Unknown cipher',
          senderDisplayName: payload.senderDisplayName
        };
      }

      const strategy = CipherFactory.getStrategy(payload.cipher);
      const iv = CryptoJS.enc.Hex.parse(payload.iv);
      const key = payload.cipher === 'AES' ? sharedKeys.aesKey : sharedKeys.desKey;
      const plaintext = strategy.decrypt(payload.ciphertext, key, iv);

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

  const rekey = (): void => {
    if (!lastPassword) {
      isReady.value = false;
      sharedKeys = null;
      return;
    }

    setupKeys(lastPassword);
  };

  return {
    activeBitLength,
    isReady,
    isEncrypted,
    setupKeys,
    encryptMessage,
    decryptMessage,
    rekey
  };
});
