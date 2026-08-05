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
  it('renders input field, paperclip attachment button, voice record button, and send button', () => {
    const wrapper = mount(MessageInput, {
      global: defaultGlobal
    });

    expect(wrapper.find('input[type="file"]').exists()).toBe(true);
    expect(wrapper.findComponent(InputText).exists()).toBe(true);
    expect(wrapper.findAllComponents(Button).length).toBe(3);
    expect(wrapper.find('.voice-record-btn').exists()).toBe(true);
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

    const sendBtn = wrapper.find('.send-btn');
    await sendBtn.trigger('click');

    expect(wrapper.emitted('send')).toBeTruthy();
    expect(wrapper.emitted('send')![0]).toEqual(['Hello SecureChat!']);
  });

  it('does not emit send event if input is empty or whitespace', async () => {
    const wrapper = mount(MessageInput, {
      global: defaultGlobal
    });

    const textInput = wrapper.findComponent(InputText);
    await textInput.setValue('   ');

    const sendBtn = wrapper.find('.send-btn');
    await sendBtn.trigger('click');

    expect(wrapper.emitted('send')).toBeFalsy();
  });

  it('emits sendFile event when a valid file under 100 MB is attached', async () => {
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

  it('displays error message and rejects files exceeding 100 MB', async () => {
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
    expect(wrapper.text()).toContain('exceeds maximum size of 100 MB');
  });

  it('displays error toast when showFileToast is called via ref component method', async () => {
    const wrapper = mount(MessageInput, {
      global: defaultGlobal
    });

    (wrapper.vm as unknown as { showFileToast: (msg: string) => void }).showFileToast('File "dropped.zip" (120.0 MB) exceeds maximum size of 100 MB.');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('File "dropped.zip" (120.0 MB) exceeds maximum size of 100 MB.');
  });
});
