import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ModeBanner from '../chat/ModeBanner.vue';

describe('ModeBanner', () => {
  it('renders plaintext warning when isEncrypted is false', () => {
    const wrapper = mount(ModeBanner, { props: { isEncrypted: false } });
    expect(wrapper.text()).toContain('Plaintext Mode Active');
    expect(wrapper.find('.plaintext-mode').exists()).toBe(true);
  });

  it('renders encrypted message when isEncrypted is true', () => {
    const wrapper = mount(ModeBanner, { props: { isEncrypted: true } });
    expect(wrapper.text()).toContain('End-to-End Encryption Enabled');
    expect(wrapper.find('.encrypted-mode').exists()).toBe(true);
  });

  it('renders reconnecting banner when connectionStatus is reconnecting', () => {
    const wrapper = mount(ModeBanner, { props: { isEncrypted: true, connectionStatus: 'reconnecting' } });
    expect(wrapper.text()).toContain('Signaling Reconnecting...');
    expect(wrapper.find('.reconnecting-mode').exists()).toBe(true);
  });
});
