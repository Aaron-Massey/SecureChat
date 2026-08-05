import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MediaAttachment from '../chat/MediaAttachment.vue';
import * as fileChunker from '@/utils/fileChunker';

describe('MediaAttachment', () => {
  it('renders generic file download card for non-media file', () => {
    const wrapper = mount(MediaAttachment, {
      props: {
        fileName: 'report.pdf',
        fileSize: 1024 * 1024,
        mimeType: 'application/pdf',
        mediaUrl: 'blob:http://localhost/dummy-pdf'
      }
    });

    expect(wrapper.text()).toContain('report.pdf');
    expect(wrapper.text()).toContain('1.0 MB');
    expect(wrapper.text()).toContain('Download');
  });

  it('renders unrevealed overlay for images until button click', async () => {
    const wrapper = mount(MediaAttachment, {
      props: {
        fileName: 'photo.png',
        fileSize: 500 * 1024,
        mimeType: 'image/png',
        mediaUrl: 'blob:http://localhost/dummy-img'
      }
    });

    expect(wrapper.text()).toContain('Preview Image');
    expect(wrapper.find('img').exists()).toBe(false);

    // Click reveal button
    await wrapper.find('.reveal-button').trigger('click');

    expect(wrapper.find('img').exists()).toBe(true);
    expect(wrapper.find('img').attributes('src')).toBe('blob:http://localhost/dummy-img');

    // Click hide button
    await wrapper.find('.hide-button').trigger('click');
    expect(wrapper.find('img').exists()).toBe(false);
  });

  it('renders inline audio player for audio media attachments', async () => {
    const wrapper = mount(MediaAttachment, {
      props: {
        fileName: 'voice_note.mp3',
        fileSize: 250 * 1024,
        mimeType: 'audio/mp3',
        mediaUrl: 'blob:http://localhost/dummy-audio'
      }
    });

    expect(wrapper.text()).toContain('Preview Audio');
    expect(wrapper.find('.custom-audio-player').exists()).toBe(false);

    // Reveal audio player
    await wrapper.find('.reveal-button').trigger('click');
    expect(wrapper.find('.custom-audio-player').exists()).toBe(true);
    expect(wrapper.find('audio').attributes('src')).toBe('blob:http://localhost/dummy-audio');
  });

  it('detects audio-only WebM files and switches from video to AudioPlayer', async () => {
    const wrapper = mount(MediaAttachment, {
      props: {
        fileName: 'music.webm',
        fileSize: 1024 * 1024,
        mimeType: 'video/webm',
        mediaUrl: 'blob:http://localhost/dummy-webm-audio'
      }
    });

    await wrapper.find('.reveal-button').trigger('click');
    const video = wrapper.find('video');
    expect(video.exists()).toBe(true);

    // Simulate loadedmetadata event with 0x0 video dimensions
    Object.defineProperty(video.element, 'videoWidth', { value: 0 });
    Object.defineProperty(video.element, 'videoHeight', { value: 0 });
    await video.trigger('loadedmetadata');

    expect(wrapper.find('.custom-audio-player').exists()).toBe(true);
    expect(wrapper.find('video').exists()).toBe(false);
  });

  it('renders progress bar when file is transferring', () => {
    const wrapper = mount(MediaAttachment, {
      props: {
        fileName: 'video.mp4',
        fileSize: 5 * 1024 * 1024,
        mimeType: 'video/mp4',
        mediaUrl: '',
        isTransferring: true,
        progress: 45
      }
    });

    expect(wrapper.text()).toContain('Receiving 45%');
    expect(wrapper.find('.progress-bar-fill').attributes('style')).toContain('width: 45%');
  });

  it('revokes object URL on unmount', () => {
    const revokeSpy = vi.spyOn(fileChunker, 'revokeObjectUrl').mockImplementation(() => {});

    const wrapper = mount(MediaAttachment, {
      props: {
        fileName: 'test.png',
        fileSize: 100,
        mimeType: 'image/png',
        mediaUrl: 'blob:http://localhost/dummy-url'
      }
    });

    wrapper.unmount();
    expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/dummy-url');
    revokeSpy.mockRestore();
  });
});
