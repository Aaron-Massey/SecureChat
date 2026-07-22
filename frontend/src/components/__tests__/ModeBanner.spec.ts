import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ModeBanner from '../chat/ModeBanner.vue';

describe('ModeBanner', () => {
  it('renders plaintext warning when isEncrypted is false', () => {
    const wrapper = mount(ModeBanner, { props: { isEncrypted: false } });
    expect(wrapper.text()).toContain('Plaintext mode enabled');
    expect(wrapper.classes()).toContain('plaintext-mode');
  });

  it('renders encrypted message when isEncrypted is true', () => {
    const wrapper = mount(ModeBanner, { props: { isEncrypted: true } });
    expect(wrapper.text()).toContain('Encrypted mode enabled');
    expect(wrapper.classes()).toContain('encrypted-mode');
  });
});
