import CryptoJS from 'crypto-js';

/**
 * Strategy Pattern: ICipherStrategy
 */
export interface ICipherStrategy {
  readonly cipherName: 'AES' | 'DES';
  readonly ivByteLength: number;
  encrypt(plaintext: string, key: CryptoJS.lib.WordArray, iv: CryptoJS.lib.WordArray): string;
  decrypt(ciphertext: string, key: CryptoJS.lib.WordArray, iv: CryptoJS.lib.WordArray): string;
}

export class AesCipherStrategy implements ICipherStrategy {
  readonly cipherName = 'AES' as const;
  readonly ivByteLength = 16;

  encrypt(plaintext: string, key: CryptoJS.lib.WordArray, iv: CryptoJS.lib.WordArray): string {
    return CryptoJS.AES.encrypt(plaintext, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString();
  }

  decrypt(ciphertext: string, key: CryptoJS.lib.WordArray, iv: CryptoJS.lib.WordArray): string {
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}

export class DesCipherStrategy implements ICipherStrategy {
  readonly cipherName = 'DES' as const;
  readonly ivByteLength = 8;

  encrypt(plaintext: string, key: CryptoJS.lib.WordArray, iv: CryptoJS.lib.WordArray): string {
    return CryptoJS.DES.encrypt(plaintext, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString();
  }

  decrypt(ciphertext: string, key: CryptoJS.lib.WordArray, iv: CryptoJS.lib.WordArray): string {
    const decrypted = CryptoJS.DES.decrypt(ciphertext, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}

export class CipherFactory {
  private static strategies: Record<'AES' | 'DES', ICipherStrategy> = {
    AES: new AesCipherStrategy(),
    DES: new DesCipherStrategy()
  };

  public static getStrategy(cipher: 'AES' | 'DES'): ICipherStrategy {
    const strategy = this.strategies[cipher];
    if (!strategy) {
      throw new Error(`Unsupported cipher strategy: ${cipher}`);
    }
    return strategy;
  }

  public static getStrategyByBitLength(bitLength: 128 | 56): ICipherStrategy {
    return bitLength === 128 ? this.strategies.AES : this.strategies.DES;
  }
}
