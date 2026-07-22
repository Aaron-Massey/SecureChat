import { describe, it, expect } from 'vitest';
import CryptoJS from 'crypto-js';
import { CipherFactory, AesCipherStrategy, DesCipherStrategy } from '../cipher.strategy';

describe('Cipher Strategy Pattern', () => {
  it('returns AesCipherStrategy for AES and 128 bit length', () => {
    const strategy1 = CipherFactory.getStrategy('AES');
    const strategy2 = CipherFactory.getStrategyByBitLength(128);

    expect(strategy1).toBeInstanceOf(AesCipherStrategy);
    expect(strategy2).toBeInstanceOf(AesCipherStrategy);
    expect(strategy1.ivByteLength).toBe(16);
  });

  it('returns DesCipherStrategy for DES and 56 bit length', () => {
    const strategy1 = CipherFactory.getStrategy('DES');
    const strategy2 = CipherFactory.getStrategyByBitLength(56);

    expect(strategy1).toBeInstanceOf(DesCipherStrategy);
    expect(strategy2).toBeInstanceOf(DesCipherStrategy);
    expect(strategy1.ivByteLength).toBe(8);
  });

  it('encrypts and decrypts text using AES strategy', () => {
    const strategy = CipherFactory.getStrategy('AES');
    const key = CryptoJS.enc.Hex.parse('00112233445566778899aabbccddeeff');
    const iv = CryptoJS.lib.WordArray.random(strategy.ivByteLength);
    const plaintext = 'Secret AES message';

    const ciphertext = strategy.encrypt(plaintext, key, iv);
    expect(ciphertext).toBeTypeOf('string');
    expect(ciphertext).not.toBe(plaintext);

    const decrypted = strategy.decrypt(ciphertext, key, iv);
    expect(decrypted).toBe(plaintext);
  });

  it('encrypts and decrypts text using DES strategy', () => {
    const strategy = CipherFactory.getStrategy('DES');
    const key = CryptoJS.enc.Hex.parse('0123456789abcdef');
    const iv = CryptoJS.lib.WordArray.random(strategy.ivByteLength);
    const plaintext = 'Secret DES message';

    const ciphertext = strategy.encrypt(plaintext, key, iv);
    expect(ciphertext).toBeTypeOf('string');
    expect(ciphertext).not.toBe(plaintext);

    const decrypted = strategy.decrypt(ciphertext, key, iv);
    expect(decrypted).toBe(plaintext);
  });
});
