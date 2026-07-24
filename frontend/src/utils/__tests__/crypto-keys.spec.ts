import { describe, it, expect } from 'vitest';
import { deriveCryptoKeys, getIvLength } from '../crypto-keys';

describe('crypto-keys utility', () => {
  it('derives aesKey, desKey, and hmacKey from passphrase and salt', () => {
    const keys = deriveCryptoKeys('my-secret-passphrase', 'test-salt', 100);

    expect(keys.aesKey).toBeDefined();
    expect(keys.desKey).toBeDefined();
    expect(keys.hmacKey).toBeDefined();

    expect(keys.aesKey.sigBytes).toBe(16); // 128 bit = 16 bytes
    expect(keys.desKey.sigBytes).toBe(8);   // 64 bit = 8 bytes
    expect(keys.hmacKey.sigBytes).toBe(32); // 256 bit = 32 bytes
  });

  it('produces different keys for different passphrases', () => {
    const keys1 = deriveCryptoKeys('pass1', 'salt', 10);
    const keys2 = deriveCryptoKeys('pass2', 'salt', 10);

    expect(keys1.aesKey.toString()).not.toBe(keys2.aesKey.toString());
  });

  it('returns correct IV byte lengths for AES and DES', () => {
    expect(getIvLength('AES')).toBe(16);
    expect(getIvLength('DES')).toBe(8);
  });
});
