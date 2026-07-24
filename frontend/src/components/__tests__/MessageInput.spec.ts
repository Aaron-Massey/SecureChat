import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MessageInput from '../chat/MessageInput.vue';
import PrimeVue from 'primevue/config';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Tooltip from 'primevue/tooltip';
import { MAX_FILE_SIZE } from '@/utils/fileChunker';

const defaultGlobal = {
  plugins: [PrimeVue],
  components: { InputText, Button },
  directives: { tooltip: Tooltip }
};

describe('MessageInput', () => {
  it('renders input field, paperclip attachment button, and send button', () => {
    const wrapper = mount(MessageInput, {
      global: defaultGlobal
    });

    expect(wrapper.find('input[type="file"]').exists()).toBe(true);
    expect(wrapper.findComponent(InputText).exists()).toBe(true);
    expect(wrapper.findAllComponents(Button).length).toBe(2);
  });

  it('renders message quota indicator when quotaMax is passed', () => {
    const wrapper = mount(MessageInput, {
      props: { quotaUsed: 5, quotaMax: 30 },
      global: defaultGlobal
    });

    expect(wrapper.find('.quota-indicator-wrapper').exists()).toBe(true);
    expect(wrapper.find('.quota-ring').exists()).toBe(true);
  });

  it('emits send event with input text and clears input on send', async () => {
    const wrapper = mount(MessageInput, {
      global: defaultGlobal
    });

    const textInput = wrapper.findComponent(InputText);
    await textInput.setValue('Hello SecureChat!');

    const sendBtn = wrapper.findAllComponents(Button)[1];
    await sendBtn!.trigger('click');

    expect(wrapper.emitted('send')).toBeTruthy();
    expect(wrapper.emitted('send')![0]).toEqual(['Hello SecureChat!']);
  });

  it('does not emit send event if input is empty or whitespace', async () => {
    const wrapper = mount(MessageInput, {
      global: defaultGlobal
    });

    const textInput = wrapper.findComponent(InputText);
    await textInput.setValue('   ');

    const sendBtn = wrapper.findAllComponents(Button)[1];
    await sendBtn!.trigger('click');

    expect(wrapper.emitted('send')).toBeFalsy();
  });

  it('emits sendFile event when a valid file under 25 MB is attached', async () => {
    const wrapper = mount(MessageInput, {
      global: defaultGlobal
    });

    const fileInput = wrapper.find('input[type="file"]');
    const validFile = new File(['dummy bytes'], 'sample.pdf', { type: 'application/pdf' });

    Object.defineProperty(fileInput.element, 'files', {
      value: [validFile]
    });

    await fileInput.trigger('change');

    expect(wrapper.emitted('sendFile')).toBeTruthy();
    expect(wrapper.emitted('sendFile')![0]![0]).toBe(validFile);
  });

  it('displays error message and rejects files exceeding 25 MB', async () => {
    const wrapper = mount(MessageInput, {
      global: defaultGlobal
    });

    const fileInput = wrapper.find('input[type="file"]');
    const oversizedFile = new File([''], 'large_video.mp4', { type: 'video/mp4' });
    Object.defineProperty(oversizedFile, 'size', { value: MAX_FILE_SIZE + 1024 });

    Object.defineProperty(fileInput.element, 'files', {
      value: [oversizedFile]
    });

    await fileInput.trigger('change');

    expect(wrapper.emitted('sendFile')).toBeFalsy();
    expect(wrapper.text()).toContain('exceeds maximum size of 25 MB');
  });
});
