import {act, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {AsideProvider, useAside} from '~/components/layout/Aside';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('overlay exit lifecycle', () => {
  it('keeps the overlay active for its fade and ignores repeated close requests', () => {
    const {result} = renderHook(useAside, {wrapper: AsideProvider});
    act(() => result.current.open('search'));
    act(() => result.current.close());
    expect(result.current.type).toBe('search');
    expect(result.current.isExiting).toBe(true);

    act(() => {
      vi.advanceTimersByTime(299);
    });
    act(() => result.current.close());
    expect(result.current.type).toBe('search');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.type).toBe('closed');
    expect(result.current.isExiting).toBe(false);
  });

  it('cancels an old exit when another overlay opens', () => {
    const {result} = renderHook(useAside, {wrapper: AsideProvider});
    act(() => result.current.open('search'));
    act(() => result.current.close());
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => result.current.open('cart'));
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.type).toBe('cart');
    expect(result.current.isExiting).toBe(false);
  });

  it('skips the fade delay when reduced motion is requested', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
    } as MediaQueryList);
    const {result} = renderHook(useAside, {wrapper: AsideProvider});
    act(() => result.current.open('cart'));
    act(() => result.current.close());
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current.type).toBe('closed');
    expect(result.current.isExiting).toBe(false);
  });

  it('clears the pending exit timer when the provider unmounts', () => {
    const {result, unmount} = renderHook(useAside, {wrapper: AsideProvider});
    act(() => result.current.open('cart'));
    act(() => result.current.close());
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
