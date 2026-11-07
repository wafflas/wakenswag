import {StrictMode} from 'react';
import {act, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ButtonSound} from '~/components/shared/ButtonSound';

function mockAudio() {
  const gain = {gain: {value: 0}, connect: vi.fn(), disconnect: vi.fn()};
  const source = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    addEventListener: vi.fn(),
    start: vi.fn(),
  };
  const context = {
    state: 'running',
    destination: {},
    createGain: vi.fn(() => gain),
    createBufferSource: vi.fn(() => source),
    decodeAudioData: vi.fn().mockResolvedValue({}),
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const constructor = vi.fn(function () {
    return context;
  });
  vi.stubGlobal('AudioContext', constructor);
  const response = {
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  } as Response;
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
  return {constructor, context, gain, source, fetch, response};
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('interface sounds', () => {
  it('waits through mounting and hover, then plays the first click once ready', async () => {
    const user = userEvent.setup();
    const audio = mockAudio();
    render(
      <>
        <ButtonSound />
        <button type="button">Open Info</button>
      </>,
    );
    const button = screen.getByRole('button', {name: 'Open Info'});
    await user.hover(button);
    expect(audio.constructor).not.toHaveBeenCalled();
    expect(audio.fetch).not.toHaveBeenCalled();
    await user.click(button);
    await waitFor(() => expect(audio.source.start).toHaveBeenCalledOnce());
    expect(audio.constructor).toHaveBeenCalledOnce();
    expect(audio.fetch).toHaveBeenCalledTimes(2);
    await user.click(button);
    expect(audio.constructor).toHaveBeenCalledOnce();
    expect(audio.fetch).toHaveBeenCalledTimes(2);
  });

  it('initializes once on keyboard input even with React StrictMode', async () => {
    const user = userEvent.setup();
    const audio = mockAudio();
    render(
      <StrictMode>
        <ButtonSound />
        <button type="button">Open Info</button>
      </StrictMode>,
    );
    expect(audio.constructor).not.toHaveBeenCalled();
    screen.getByRole('button', {name: 'Open Info'}).focus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(audio.source.start).toHaveBeenCalledOnce());
    expect(audio.constructor).toHaveBeenCalledOnce();
  });

  it('skips hover on a focused control while preserving hover elsewhere and activation sounds', async () => {
    const user = userEvent.setup();
    const audio = mockAudio();
    render(
      <>
        <ButtonSound cooldownMs={0} />
        <button type="button">
          <span>First</span>
        </button>
        <button type="button">Second</button>
      </>,
    );
    const first = screen.getByRole('button', {name: 'First'});
    const second = screen.getByRole('button', {name: 'Second'});
    await user.click(first);
    await waitFor(() => expect(audio.source.start).toHaveBeenCalledTimes(1));
    expect(first).toHaveFocus();

    await user.hover(second);
    expect(audio.source.start).toHaveBeenCalledTimes(2);
    await user.hover(screen.getByText('First'));
    expect(first).toHaveFocus();
    expect(audio.source.start).toHaveBeenCalledTimes(2);

    await user.click(first);
    await waitFor(() => expect(audio.source.start).toHaveBeenCalledTimes(3));
    await user.keyboard('{Enter}');
    await waitFor(() => expect(audio.source.start).toHaveBeenCalledTimes(4));
  });

  it('aborts pending downloads and prevents late playback after unmount', async () => {
    const user = userEvent.setup();
    const audio = mockAudio();
    let resolve!: (response: Response) => void;
    const pending = new Promise<Response>((finish) => {
      resolve = finish;
    });
    audio.fetch.mockReturnValue(pending);
    const view = render(
      <>
        <ButtonSound />
        <button type="button">Open Info</button>
      </>,
    );
    await user.click(screen.getByRole('button', {name: 'Open Info'}));
    const signal = audio.fetch.mock.calls[0][1]?.signal;
    view.unmount();
    expect(signal?.aborted).toBe(true);
    expect(audio.context.close).toHaveBeenCalledOnce();
    expect(audio.gain.disconnect).toHaveBeenCalledTimes(2);
    await act(async () => {
      resolve(audio.response);
      await pending;
    });
    expect(audio.source.start).not.toHaveBeenCalled();
  });
});
