import '@testing-library/jest-dom/vitest';

// jsdom does not implement matchMedia, which ThemeContext calls when the
// theme is "system". Provide a minimal stub so the real provider tree renders.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}
