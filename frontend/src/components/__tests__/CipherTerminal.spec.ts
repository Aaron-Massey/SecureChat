import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CipherTerminal from '../chat/CipherTerminal.vue';
import type { SecurePayload } from '@shared/types/payload';

describe('CipherTerminal', () => {
  it('renders unencrypted payload log entry', () => {
    const debugHistory: SecurePayload[] = [
      {
        senderDisplayName: 'Alice',
        plaintext: 'Hello unencrypted',
        cipher: 'none',
        timestamp: '12:05 PM'
      }
    ];

    const wrapper = mount(CipherTerminal, {
      props: { debugHistory }
    });

    expect(wrapper.text()).toContain('Sender: Alice | Cipher: none | Timestamp: 12:05 PM');
    expect(wrapper.text()).toContain('Plaintext: Hello unencrypted');
  });

  it('renders encrypted payload log entry with IV, HMAC, and Ciphertext details', () => {
    const debugHistory: SecurePayload[] = [
      {
        senderDisplayName: 'Bob',
        cipher: 'AES',
        version: 1,
        iv: '00112233445566778899aabbccddeeff',
        hmac: 'abcdef1234567890',
        ciphertext: 'U2FsdGVkX1812345',
        timestamp: '12:06 PM'
      }
    ];

    const wrapper = mount(CipherTerminal, {
      props: { debugHistory }
    });

    expect(wrapper.text()).toContain('Sender: Bob | Cipher: AES | Version: 1 | Timestamp: 12:06 PM');
    expect(wrapper.text()).toContain('IV: 00112233445566778899aabbccddeeff');
    expect(wrapper.text()).toContain('HMAC: abcdef1234567890');
    expect(wrapper.text()).toContain('Ciphertext: U2FsdGVkX1812345');
  });
});
