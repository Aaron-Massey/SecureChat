import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { SecurePayload } from '@shared/types/payload';
import CryptoJS from 'crypto-js';
import { getCryptoDerivationSettings } from '@/config/crypto';
import { deriveCryptoKeys } from '@/utils/crypto-keys';
import { CipherFactory } from '@/crypto/cipher.strategy';
import { KeyRatchetContext } from '@/patterns/keyRatchetContext';

export interface DecryptResult {
  success: boolean;
  plaintext: string;
  senderDisplayName: string;
}

export const useCryptoStore = defineStore('crypto', () => {
  const activeBitLength = ref<128 | 56>(128);
  const ratchetMode = ref<'hash' | 'static'>('hash');
  const isReady = ref(false);
  const isEncrypted = computed(() => isReady.value);
  const keyVersion = ref<number>(1);

  let lastPassword: string | null = null;
  let ratchetContext: KeyRatchetContext | null = null;

  const setupKeys = (password: string, mode: 'hash' | 'static' = ratchetMode.value): void => {
    if (!password || password.trim().length === 0) {
      isReady.value = false;
      lastPassword = null;
      ratchetContext = null;
      keyVersion.value = 1;
      return;
    }

    const { salt, iterations } = getCryptoDerivationSettings();
    const initialKeys = deriveCryptoKeys(password, salt, iterations);
    
    ratchetMode.value = mode;
    ratchetContext = new KeyRatchetContext(initialKeys, 1, mode);
    lastPassword = password;
    keyVersion.value = ratchetContext.version;
    isReady.value = true;
  };

  const encryptMessage = (
    plaintext: string,
    senderDisplayName: string
  ): SecurePayload => {
    if (!isReady.value || !ratchetContext) {
      throw new Error('Crypto store not ready. Call setupKeys first.');
    }

    const currentVersion = ratchetContext.version;
    const currentKeys = ratchetContext.keys;

    const strategy = CipherFactory.getStrategyByBitLength(activeBitLength.value);
    const iv = CryptoJS.lib.WordArray.random(strategy.ivByteLength);
    const ivHex = iv.toString();

    const key = strategy.cipherName === 'AES' ? currentKeys.aesKey : currentKeys.desKey;
    const ciphertextHex = strategy.encrypt(plaintext, key, iv);
    const hmac = CryptoJS.HmacSHA256(ciphertextHex, currentKeys.hmacKey).toString();

    const payload: SecurePayload = {
      senderDisplayName,
      iv: ivHex,
      ciphertext: ciphertextHex,
      version: currentVersion,
      cipher: strategy.cipherName,
      hmac,
      timestamp: new Date().toISOString()
    };

    // Advance ratchet step for next message if ratcheting enabled
    ratchetContext.ratchetStep();
    keyVersion.value = ratchetContext.version;

    return payload;
  };

  const decryptMessage = (payload: SecurePayload): DecryptResult => {
    if (!isReady.value || !ratchetContext) {
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

      const targetVersion = payload.version ?? 1;
      const targetKeys = ratchetContext.getKeysForVersion(targetVersion);

      if (!targetKeys) {
        return {
          success: false,
          plaintext: `Key version ${targetVersion} unavailable or expired`,
          senderDisplayName: payload.senderDisplayName
        };
      }

      keyVersion.value = ratchetContext.version;

      if (payload.hmac) {
        const calculatedHmac = CryptoJS.HmacSHA256(payload.ciphertext, targetKeys.hmacKey).toString();
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
      const key = payload.cipher === 'AES' ? targetKeys.aesKey : targetKeys.desKey;
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
      ratchetContext = null;
      keyVersion.value = 1;
      return;
    }

    setupKeys(lastPassword, ratchetMode.value);
  };

  return {
    activeBitLength,
    ratchetMode,
    isReady,
    isEncrypted,
    keyVersion,
    setupKeys,
    encryptMessage,
    decryptMessage,
    rekey
  };
});
