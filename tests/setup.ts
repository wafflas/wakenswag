import {mockCartRequest} from './fixtures/shopifyRuntime';
import '@testing-library/jest-dom/vitest';
import {cleanup} from '@testing-library/react';
import {afterEach, beforeEach, vi} from 'vitest';

beforeEach(() => mockCartRequest(() => undefined));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

window.scrollTo = vi.fn();

// jsdom has no layout observer; real viewport prefetch runs in Playwright.
beforeEach(() =>
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  ),
);
