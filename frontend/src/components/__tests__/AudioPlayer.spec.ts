import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AudioPlayer from '../chat/AudioPlayer.vue';

describe('AudioPlayer', () => {
  it('renders audio title and controls correctly', () => {
    const wrapper = mount(AudioPlayer, {
      props: {
        src: 'blob:http://localhost/dummy-audio',
        fileName: 'voice_note.mp3'
      }
    });

    expect(wrapper.text()).toContain('voice_note.mp3');
    expect(wrapper.find('.play-pause-btn').exists()).toBe(true);
    expect(wrapper.find('.audio-scrubber').exists()).toBe(true);
    expect(wrapper.find('.waveform-bars').exists()).toBe(true);
  });

  it('toggles mute state when volume button is clicked', async () => {
    const wrapper = mount(AudioPlayer, {
      props: {
        src: 'blob:http://localhost/dummy-audio',
        fileName: 'test.wav'
      }
    });

    const volumeBtn = wrapper.find('.volume-btn');
    expect(volumeBtn.attributes('title')).toBe('Mute');

    await volumeBtn.trigger('click');
    expect(volumeBtn.attributes('title')).toBe('Unmute');
  });

  it('updates volume level when volume slider changes', async () => {
    const wrapper = mount(AudioPlayer, {
      props: {
        src: 'blob:http://localhost/dummy-audio',
        fileName: 'test.wav'
      }
    });

    const volumeSlider = wrapper.find('.volume-slider');
    expect(volumeSlider.exists()).toBe(true);

    await volumeSlider.setValue(0.5);
    expect((volumeSlider.element as HTMLInputElement).value).toBe('0.5');
  });
});
