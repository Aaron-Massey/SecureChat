import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MessageFeed from '../chat/MessageFeed.vue';
import PrimeVue from 'primevue/config';
import Checkbox from 'primevue/checkbox';

describe('MessageFeed', () => {
  const sampleMessages = [
    { sender: 'Alice', text: 'Hello Bob', decrypted: true, timestamp: '12:00 PM' },
    { sender: 'Bob', text: 'Failed to decrypt message', decrypted: false, timestamp: '12:01 PM' }
  ];

  it('renders chat messages with sender, text, and timestamp', () => {
    const wrapper = mount(MessageFeed, {
      props: { chatHistory: sampleMessages, showUndecrypted: true },
      global: {
        plugins: [PrimeVue],
        components: { Checkbox }
      }
    });

    expect(wrapper.text()).toContain('Alice: Hello Bob');
    expect(wrapper.text()).toContain('Bob: Failed to decrypt message');
    expect(wrapper.text()).toContain('12:00 PM');
  });

  it('filters out undecrypted messages when showUndecrypted is false', () => {
    const wrapper = mount(MessageFeed, {
      props: { chatHistory: sampleMessages, showUndecrypted: false },
      global: {
        plugins: [PrimeVue],
        components: { Checkbox }
      }
    });

    expect(wrapper.text()).toContain('Alice: Hello Bob');
    expect(wrapper.text()).not.toContain('Bob: Failed to decrypt message');
  });

  it('applies undecrypted CSS class to undecrypted messages', () => {
    const wrapper = mount(MessageFeed, {
      props: { chatHistory: sampleMessages, showUndecrypted: true },
      global: {
        plugins: [PrimeVue],
        components: { Checkbox }
      }
    });

    const items = wrapper.findAll('.message-item');
    expect(items.length).toBe(2);
    expect(items[0].classes()).not.toContain('undecrypted');
    expect(items[1].classes()).toContain('undecrypted');
  });
});
