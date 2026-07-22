import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MessageInput from '../chat/MessageInput.vue';
import PrimeVue from 'primevue/config';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

describe('MessageInput', () => {
  it('renders input field and send button', () => {
    const wrapper = mount(MessageInput, {
      global: {
        plugins: [PrimeVue],
        components: { InputText, Button }
      }
    });

    expect(wrapper.find('input').exists()).toBe(true);
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('emits send event with input text and clears input on send', async () => {
    const wrapper = mount(MessageInput, {
      global: {
        plugins: [PrimeVue],
        components: { InputText, Button }
      }
    });

    const input = wrapper.find('input');
    await input.setValue('Hello SecureChat!');

    const button = wrapper.find('button');
    await button.trigger('click');

    expect(wrapper.emitted('send')).toBeTruthy();
    expect(wrapper.emitted('send')![0]).toEqual(['Hello SecureChat!']);
    expect((input.element as HTMLInputElement).value).toBe('');
  });

  it('does not emit send event if input is empty or whitespace', async () => {
    const wrapper = mount(MessageInput, {
      global: {
        plugins: [PrimeVue],
        components: { InputText, Button }
      }
    });

    const input = wrapper.find('input');
    await input.setValue('   ');

    const button = wrapper.find('button');
    await button.trigger('click');

    expect(wrapper.emitted('send')).toBeFalsy();
  });
});
