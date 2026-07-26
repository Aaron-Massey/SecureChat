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

    expect(wrapper.text()).toContain('Alice');
    expect(wrapper.text()).toContain('Hello Bob');
    expect(wrapper.text()).toContain('Bob');
    expect(wrapper.text()).toContain('Failed to decrypt message');
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

    expect(wrapper.text()).toContain('Alice');
    expect(wrapper.text()).toContain('Hello Bob');
    expect(wrapper.text()).not.toContain('Failed to decrypt message');
  });

  it('applies undecrypted CSS class to undecrypted messages', () => {
    const wrapper = mount(MessageFeed, {
      props: { chatHistory: sampleMessages, showUndecrypted: true },
      global: {
        plugins: [PrimeVue],
        components: { Checkbox }
      }
    });

    const items = wrapper.findAll('.message-wrapper');
    expect(items.length).toBe(2);
    expect(items[0]!.classes()).not.toContain('undecrypted');
    expect(items[1]!.classes()).toContain('undecrypted');
  });

  it('distinguishes real system messages from a user named System', () => {
    const messages = [
      { sender: 'System', text: 'Real system alert', decrypted: true, isSystem: true, timestamp: '12:02 PM' },
      { sender: 'System', text: 'Fake system attempt by a user', decrypted: true, isSystem: false, timestamp: '12:03 PM' }
    ];

    const wrapper = mount(MessageFeed, {
      props: { chatHistory: messages, showUndecrypted: true },
      global: {
        plugins: [PrimeVue],
        components: { Checkbox }
      }
    });

    const wrappers = wrapper.findAll('.message-wrapper');
    expect(wrappers.length).toBe(2);

    // Real system message has system-wrapper class and system badge
    expect(wrappers[0]!.classes()).toContain('system-wrapper');
    expect(wrappers[0]!.find('.system-badge').exists()).toBe(true);

    // Fake system user message does NOT have system-wrapper class or system badge
    expect(wrappers[1]!.classes()).not.toContain('system-wrapper');
    expect(wrappers[1]!.find('.system-badge').exists()).toBe(false);
  });
});
