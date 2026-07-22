import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SetupBar from '../chat/SetupBar.vue';
import PrimeVue from 'primevue/config';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';

describe('SetupBar', () => {
  it('renders display name, password input, and cipher dropdown', () => {
    const wrapper = mount(SetupBar, {
      props: {
        displayName: 'Alice',
        passwordInput: 'secret123',
        activeBitLength: 128
      },
      global: {
        plugins: [PrimeVue],
        components: { InputText, Dropdown }
      }
    });

    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('Alice');
    expect((inputs[1]!.element as HTMLInputElement).value).toBe('secret123');
  });

  it('emits inputStarted on typing display name', async () => {
    const wrapper = mount(SetupBar, {
      props: {
        displayName: '',
        passwordInput: '',
        activeBitLength: 128
      },
      global: {
        plugins: [PrimeVue],
        components: { InputText, Dropdown }
      }
    });

    const input = wrapper.findAll('input')[0];
    await input!.trigger('input');

    expect(wrapper.emitted('inputStarted')).toBeTruthy();
  });
});
