import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { deriveCryptoKeys } from '@/utils/crypto-keys';
import { KeyRatchetFactory } from '../keyRatchet.strategy';
import { KeyRatchetContext } from '@/patterns/keyRatchetContext';
import { useCryptoStore } from '@/stores/crypto';

vi.mock('@/config/crypto', () => ({
  getCryptoDerivationSettings: () => ({
    salt: 'unit-test-salt',
    iterations: 100
  })
}));

describe('Key Ratcheting & Version Sync', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('KeyRatchetStrategy (Strategy Pattern)', () => {
    it('produces new distinct derived keys on each ratchet step in HashRatchetStrategy', () => {
      const initialKeys = deriveCryptoKeys('secret-pass', 'salt', 100);
      const strategy = KeyRatchetFactory.getStrategy('hash');

      const nextKeys = strategy.ratchet(initialKeys);

      expect(nextKeys.aesKey.toString()).not.toBe(initialKeys.aesKey.toString());
      expect(nextKeys.desKey.toString()).not.toBe(initialKeys.desKey.toString());
      expect(nextKeys.hmacKey.toString()).not.toBe(initialKeys.hmacKey.toString());
    });

    it('retains identical keys in StaticRatchetStrategy', () => {
      const initialKeys = deriveCryptoKeys('secret-pass', 'salt', 100);
      const strategy = KeyRatchetFactory.getStrategy('static');

      const nextKeys = strategy.ratchet(initialKeys);

      expect(nextKeys.aesKey.toString()).toBe(initialKeys.aesKey.toString());
    });
  });

  describe('KeyRatchetContext (State Pattern)', () => {
    it('tracks version numbers and supports multi-step synchronization', () => {
      const initialKeys = deriveCryptoKeys('secret-pass', 'salt', 100);
      const context = new KeyRatchetContext(initialKeys, 1, 'hash');

      expect(context.version).toBe(1);

      context.ratchetStep();
      expect(context.version).toBe(2);

      const targetKeys = context.syncToVersion(5);
      expect(context.version).toBe(5);
      expect(targetKeys).toBeDefined();
    });
  });

  describe('End-to-End Ratcheting in Crypto Store', () => {
    it('encrypts sequential messages with incrementing version tags and allows peer auto-sync', () => {
      const aliceStore = useCryptoStore();
      const bobStore = useCryptoStore();

      // Both setup keys with the same password
      aliceStore.setupKeys('shared-secret', 'hash');
      bobStore.setupKeys('shared-secret', 'hash');

      // Alice sends message 1 (Version 1)
      const msg1 = aliceStore.encryptMessage('First message', 'Alice');
      expect(msg1.version).toBe(1);
      expect(aliceStore.keyVersion).toBe(2);

      // Alice sends message 2 (Version 2)
      const msg2 = aliceStore.encryptMessage('Second message', 'Alice');
      expect(msg2.version).toBe(2);
      expect(aliceStore.keyVersion).toBe(3);

      // Bob receives message 2 directly (out-of-order catch up to Version 2)
      const result2 = bobStore.decryptMessage(msg2);
      expect(result2.success).toBe(true);
      expect(result2.plaintext).toBe('Second message');

      // Bob receives message 1 (retrieved from version history cache)
      const result1 = bobStore.decryptMessage(msg1);
      expect(result1.success).toBe(true);
      expect(result1.plaintext).toBe('First message');
    });
  });
});
