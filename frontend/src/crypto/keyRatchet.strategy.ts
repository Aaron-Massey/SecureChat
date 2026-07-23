import CryptoJS from 'crypto-js';
import type { DerivedCryptoKeys } from '@/utils/crypto-keys';

/**
 * Strategy Pattern: IKeyRatchetStrategy
 * Key ratcheting strategies (Hash vs Static).
 */
export interface IKeyRatchetStrategy {
  readonly name: 'hash' | 'static';
  ratchet(keys: DerivedCryptoKeys): DerivedCryptoKeys;
}

export class HashRatchetStrategy implements IKeyRatchetStrategy {
  readonly name = 'hash' as const;

  ratchet(keys: DerivedCryptoKeys): DerivedCryptoKeys {
    // SHA-256 returns 256 bits (8 words)
    const nextAesHash = CryptoJS.SHA256(keys.aesKey);
    const nextDesHash = CryptoJS.SHA256(keys.desKey);
    const nextHmacHash = CryptoJS.SHA256(keys.hmacKey);

    // AES key requires 128 bits (16 bytes = 4 words)
    const nextAesKey = CryptoJS.lib.WordArray.create(nextAesHash.words.slice(0, 4), 16);

    // DES key requires 64 bits (8 bytes = 2 words)
    const nextDesKey = CryptoJS.lib.WordArray.create(nextDesHash.words.slice(0, 2), 8);

    // HMAC key requires 256 bits (32 bytes = 8 words)
    const nextHmacKey = nextHmacHash;

    return {
      aesKey: nextAesKey,
      desKey: nextDesKey,
      hmacKey: nextHmacKey
    };
  }
}

export class StaticRatchetStrategy implements IKeyRatchetStrategy {
  readonly name = 'static' as const;

  ratchet(keys: DerivedCryptoKeys): DerivedCryptoKeys {
    return keys;
  }
}

export class KeyRatchetFactory {
  private static strategies: Record<'hash' | 'static', IKeyRatchetStrategy> = {
    hash: new HashRatchetStrategy(),
    static: new StaticRatchetStrategy()
  };

  public static getStrategy(mode: 'hash' | 'static' = 'hash'): IKeyRatchetStrategy {
    return this.strategies[mode] || this.strategies.hash;
  }
}
