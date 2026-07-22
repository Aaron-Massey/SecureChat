import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCryptoStore } from '../crypto';

vi.mock('../../config/crypto', () => ({
  getCryptoDerivationSettings: () => ({
    salt: 'unit-test-salt',
    iterations: 1000
  })
}));

describe('crypto store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('derives keys from the configured salt and iterations', () => {
    const store = useCryptoStore();

    store.setupKeys('password123');

    expect(store.isReady).toBe(true);
    expect(store.isEncrypted).toBe(true);

    const payload = store.encryptMessage('hello world', 'Alice');
    const result = store.decryptMessage(payload);

    expect(result.success).toBe(true);
    expect(result.plaintext).toBe('hello world');
    expect(result.senderDisplayName).toBe('Alice');
  });

  it('clears encryption state for an empty passphrase', () => {
    const store = useCryptoStore();

    store.setupKeys('password123');
    store.setupKeys('');

    expect(store.isReady).toBe(false);
    expect(store.isEncrypted).toBe(false);
  });
});
