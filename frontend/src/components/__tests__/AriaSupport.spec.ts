import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ModeBanner from '../chat/ModeBanner.vue';
import SetupBar from '../chat/SetupBar.vue';
import MessageInput from '../chat/MessageInput.vue';
import CipherTerminal from '../chat/CipherTerminal.vue';
import MediaAttachment from '../chat/MediaAttachment.vue';
import AudioPlayer from '../chat/AudioPlayer.vue';

describe('ARIA Accessibility Support', () => {
  it('renders ARIA attributes correctly in ModeBanner', () => {
    const wrapper = mount(ModeBanner, {
      props: { isEncrypted: true, connectionStatus: 'disconnected', pendingCount: 2 }
    });
    expect(wrapper.attributes('role')).toBe('region');
    expect(wrapper.attributes('aria-label')).toBe('System Connection and Encryption Status');
    
    const banner = wrapper.find('[role="status"]');
    expect(banner.exists()).toBe(true);
    expect(banner.attributes('aria-live')).toBe('polite');
  });

  it('renders ARIA attributes correctly in SetupBar', () => {
    const wrapper = mount(SetupBar, {
      props: { displayName: 'Alice', passwordInput: '', activeBitLength: 128 },
      global: {
        stubs: ['InputText', 'Dropdown']
      }
    });
    expect(wrapper.attributes('role')).toBe('region');
    expect(wrapper.attributes('aria-label')).toBe('Security Setup Form');
  });

  it('renders ARIA attributes correctly in MessageInput', () => {
    const wrapper = mount(MessageInput, {
      props: { quotaUsed: 5, quotaMax: 50 },
      global: {
        stubs: ['InputText', 'Button']
      }
    });
    expect(wrapper.attributes('role')).toBe('region');
    expect(wrapper.attributes('aria-label')).toBe('Message Input Area');
    
    const form = wrapper.find('[role="form"]');
    expect(form.exists()).toBe(true);
    expect(form.attributes('aria-label')).toBe('Send message input form');

    const meter = wrapper.find('[role="meter"]');
    expect(meter.exists()).toBe(true);
    expect(meter.attributes('aria-valuenow')).toBe('5');
    expect(meter.attributes('aria-valuemax')).toBe('50');
  });

  it('renders ARIA attributes correctly in CipherTerminal', () => {
    const wrapper = mount(CipherTerminal, {
      props: {
        debugHistory: [
          {
            cipher: 'none',
            plaintext: 'hello world',
            senderDisplayName: 'Bob',
            timestamp: '10:00:00 AM'
          }
        ]
      }
    });
    expect(wrapper.attributes('role')).toBe('region');
    expect(wrapper.attributes('aria-label')).toBe('Payload Log Stream Panel');

    const logStream = wrapper.find('[role="log"]');
    expect(logStream.exists()).toBe(true);
    expect(logStream.attributes('aria-live')).toBe('polite');
  });

  it('renders ARIA attributes correctly in MediaAttachment', () => {
    const wrapperTransferring = mount(MediaAttachment, {
      props: {
        fileName: 'document.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        mediaUrl: 'blob:fake',
        progress: 45,
        isTransferring: true
      }
    });
    const progressBar = wrapperTransferring.find('[role="progressbar"]');
    expect(progressBar.exists()).toBe(true);
    expect(progressBar.attributes('aria-valuenow')).toBe('45');
    expect(progressBar.attributes('aria-valuemin')).toBe('0');
    expect(progressBar.attributes('aria-valuemax')).toBe('100');
  });

  it('renders ARIA attributes correctly in AudioPlayer controls and sliders', () => {
    const wrapper = mount(AudioPlayer, {
      props: {
        src: 'blob:http://localhost/dummy-audio',
        fileName: 'sample_audio.mp3'
      }
    });

    expect(wrapper.attributes('role')).toBe('region');
    expect(wrapper.attributes('aria-label')).toBe('Audio player for sample_audio.mp3');

    const playBtn = wrapper.find('.play-pause-btn');
    expect(playBtn.attributes('aria-label')).toBe('Play audio');
    expect(playBtn.attributes('aria-pressed')).toBe('false');

    const scrubber = wrapper.find('.audio-scrubber');
    expect(scrubber.attributes('aria-valuenow')).toBe('0');
    expect(scrubber.attributes('aria-valuemin')).toBe('0');

    const volumeSlider = wrapper.find('.volume-slider');
    expect(volumeSlider.attributes('aria-valuenow')).toBe('100');
    expect(volumeSlider.attributes('aria-valuemin')).toBe('0');
    expect(volumeSlider.attributes('aria-valuemax')).toBe('100');
  });
});
