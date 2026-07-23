/**
 * Polyfills for non-secure contexts (e.g., HTTP over IP addresses in local dev / Raspberry Pi deployments)
 */

if (typeof window !== 'undefined') {
  if (!window.crypto) {
    Object.defineProperty(window, 'crypto', {
      value: {} as Crypto,
      writable: true,
      configurable: true
    });
  }

  if (!window.crypto.randomUUID) {
    window.crypto.randomUUID = function randomUUID() {
      if (typeof window.crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40; // Version 4
        bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80; // Variant 10xx
        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` as `${string}-${string}-${string}-${string}-${string}`;
      }
      return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (cStr: string) => {
        const c = parseInt(cStr, 10);
        return (c ^ (Math.random() * 16 >> (c / 4))).toString(16);
      }) as `${string}-${string}-${string}-${string}-${string}`;
    };
  }
}
