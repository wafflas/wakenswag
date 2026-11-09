import {StrictMode} from 'react';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ButtonSound} from '~/components/shared/ButtonSound';

function mockAudio() {
  const gain = {gain: {value: 0}, connect: vi.fn(), disconnect: vi.fn()};
  const source = {
    buffer: null as AudioBuffer | null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    addEventListener:
      vi.fn<
        (type: string, listener: () => void, options: {once: boolean}) => void
      >(),
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
  it('preloads silently, then plays the first hover and click without downloading again', async () => {
    const user = userEvent.setup();
    const audio = mockAudio();
    render(
      <>
        <ButtonSound />
        <button type="button">Open Info</button>
      </>,
    );
    const button = screen.getByRole('button', {name: 'Open Info'});
    await waitFor(() =>
      expect(audio.context.decodeAudioData).toHaveBeenCalledTimes(3),
    );
    expect(audio.constructor).toHaveBeenCalledOnce();
    expect(audio.fetch).toHaveBeenCalledTimes(3);
    expect(audio.context.resume).not.toHaveBeenCalled();
    expect(audio.source.start).not.toHaveBeenCalled();
    await user.hover(button);
    expect(audio.source.start).toHaveBeenCalledOnce();
    await user.click(button);
    await waitFor(() => expect(audio.source.start).toHaveBeenCalledTimes(2));
    expect(audio.constructor).toHaveBeenCalledOnce();
    expect(audio.fetch).toHaveBeenCalledTimes(3);
    await user.click(button);
    expect(audio.constructor).toHaveBeenCalledOnce();
    expect(audio.fetch).toHaveBeenCalledTimes(3);
  });

  it('cleans up StrictMode preloading and plays keyboard activation only once', async () => {
    const user = userEvent.setup();
    const audio = mockAudio();
    render(
      <StrictMode>
        <ButtonSound />
        <button type="button">Open Info</button>
      </StrictMode>,
    );
    expect(audio.constructor).toHaveBeenCalledTimes(2);
    expect(audio.context.close).toHaveBeenCalledOnce();
    screen.getByRole('button', {name: 'Open Info'}).focus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(audio.source.start).toHaveBeenCalledOnce());
    expect(audio.constructor).toHaveBeenCalledTimes(2);
  });

  it('skips blocked hover sounds without queuing them, then permits hover after a real interaction', async () => {
    const user = userEvent.setup();
    const audio = mockAudio();
    audio.context.state = 'suspended';
    audio.context.resume.mockImplementation(async () => {
      audio.context.state = 'running';
    });
    render(
      <>
        <ButtonSound />
        <button type="button">Open Info</button>
      </>,
    );
    await waitFor(() =>
      expect(audio.context.decodeAudioData).toHaveBeenCalledTimes(3),
    );
    const button = screen.getByRole('button', {name: 'Open Info'});
    await user.hover(button);
    expect(audio.context.resume).not.toHaveBeenCalled();
    expect(audio.source.start).not.toHaveBeenCalled();
    await user.unhover(button);
    await user.click(document.body);
    expect(audio.context.resume).toHaveBeenCalledOnce();
    expect(audio.source.start).not.toHaveBeenCalled();
    await user.hover(button);
    expect(audio.source.start).toHaveBeenCalledOnce();
    expect(audio.fetch).toHaveBeenCalledTimes(3);
  });

  it.each(['mouse', 'touch'])(
    'unlocks suspended audio on the completed %s click, not pointerdown',
    async (pointerType) => {
      const audio = mockAudio();
      audio.context.state = 'suspended';
      let finishResume!: () => void;
      audio.context.resume.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            finishResume = () => {
              audio.context.state = 'running';
              resolve();
            };
          }),
      );
      render(
        <>
          <ButtonSound />
          <button type="button">Open Info</button>
        </>,
      );
      await waitFor(() =>
        expect(audio.context.decodeAudioData).toHaveBeenCalledTimes(3),
      );
      const button = screen.getByRole('button', {name: 'Open Info'});
      fireEvent.pointerDown(button, {pointerType});
      expect(audio.context.resume).not.toHaveBeenCalled();
      expect(audio.source.start).not.toHaveBeenCalled();
      fireEvent.pointerUp(button, {pointerType});
      fireEvent.click(button);
      expect(audio.context.resume).toHaveBeenCalledOnce();
      expect(audio.source.start).not.toHaveBeenCalled();
      await act(async () => {
        finishResume();
      });
      expect(audio.source.start).toHaveBeenCalledOnce();
    },
  );

  it('does not block clicks or replay old presses when loading is slow', async () => {
    const user = userEvent.setup();
    const audio = mockAudio();
    let finishLoading!: (response: Response) => void;
    audio.fetch.mockReturnValue(
      new Promise<Response>((resolve) => {
        finishLoading = resolve;
      }),
    );
    const onClick = vi.fn();
    render(
      <>
        <ButtonSound cooldownMs={0} />
        <button type="button" onClick={onClick}>
          Open Info
        </button>
      </>,
    );
    const button = screen.getByRole('button', {name: 'Open Info'});
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    expect(audio.source.start).not.toHaveBeenCalled();
    await act(async () => {
      finishLoading(audio.response);
    });
    expect(audio.source.start).not.toHaveBeenCalled();
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(audio.source.start).toHaveBeenCalledOnce();
    expect(audio.fetch).toHaveBeenCalledTimes(3);
  });

  it.each(['pointer', 'Enter', 'Space'])(
    'uses the dedicated back sound for %s activation, including the first press',
    async (activation) => {
      const user = userEvent.setup({skipHover: true});
      const audio = mockAudio();
      const hoverBuffer = {};
      const activateBuffer = {};
      const backBuffer = {};
      audio.context.decodeAudioData
        .mockResolvedValueOnce(hoverBuffer)
        .mockResolvedValueOnce(activateBuffer)
        .mockResolvedValueOnce(backBuffer);
      render(
        <>
          <ButtonSound cooldownMs={0} backActivateSrc="/audio/back.mp3" />
          <button type="button" data-activate-sound="back">
            <span>Back</span>
          </button>
          <button type="button">Search</button>
        </>,
      );

      if (activation === 'pointer') {
        await user.click(screen.getByText('Back'));
      } else {
        screen.getByRole('button', {name: 'Back'}).focus();
        await user.keyboard(activation === 'Enter' ? '{Enter}' : ' ');
      }

      await waitFor(() => expect(audio.source.start).toHaveBeenCalledOnce());
      expect(audio.source.buffer).toBe(backBuffer);
      expect(audio.fetch).toHaveBeenCalledWith('/audio/back.mp3', {
        signal: expect.any(AbortSignal),
      });

      await user.hover(screen.getByRole('button', {name: 'Search'}));
      expect(audio.source.buffer).toBe(hoverBuffer);
      await user.click(screen.getByRole('button', {name: 'Search'}));
      await waitFor(() => expect(audio.source.start).toHaveBeenCalledTimes(3));
      expect(audio.source.buffer).toBe(activateBuffer);
    },
  );

  it('uses the back sound for links and ignores disabled back controls', async () => {
    const user = userEvent.setup();
    const audio = mockAudio();
    const backBuffer = {};
    audio.context.decodeAudioData
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(backBuffer);
    render(
      <>
        <ButtonSound cooldownMs={0} />
        <button type="button" data-activate-sound="back" disabled>
          Back
        </button>
        <a
          href="/info"
          data-activate-sound="back"
          onClick={(event) => event.preventDefault()}
        >
          Back to Information
        </a>
      </>,
    );
    await user.click(screen.getByRole('button', {name: 'Back'}));
    expect(audio.source.start).not.toHaveBeenCalled();

    screen.getByRole('link', {name: 'Back to Information'}).focus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(audio.source.start).toHaveBeenCalledOnce());
    expect(audio.source.buffer).toBe(backBuffer);
    expect(audio.fetch).toHaveBeenCalledWith('/audio/select-choice.mp3', {
      signal: expect.any(AbortSignal),
    });
  });

  it('skips hover on a focused control while preserving hover elsewhere and activation sounds', async () => {
    const user = userEvent.setup({skipHover: true});
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
    audio.context.state = 'suspended';
    fireEvent.click(document.body);
    expect(audio.context.resume).not.toHaveBeenCalled();
    await act(async () => {
      resolve(audio.response);
      await pending;
    });
    expect(audio.source.start).not.toHaveBeenCalled();
  });

  it('does not repeat hover between children, but plays again after leaving the control', async () => {
    const user = userEvent.setup();
    const audio = mockAudio();
    render(
      <>
        <ButtonSound cooldownMs={0} />
        <button type="button">
          <span>Open</span> <span>Info</span>
        </button>
      </>,
    );
    const open = screen.getByText('Open');
    const info = screen.getByText('Info');
    await user.hover(open);
    expect(audio.source.start).toHaveBeenCalledOnce();
    // user-event omits relatedTarget for pointer transitions between children.
    fireEvent(
      open,
      new MouseEvent('pointerout', {bubbles: true, relatedTarget: info}),
    );
    fireEvent(
      info,
      new MouseEvent('pointerover', {bubbles: true, relatedTarget: open}),
    );
    expect(audio.source.start).toHaveBeenCalledOnce();
    fireEvent(
      info,
      new MouseEvent('pointerout', {
        bubbles: true,
        relatedTarget: document.body,
      }),
    );
    fireEvent(
      info,
      new MouseEvent('pointerover', {
        bubbles: true,
        relatedTarget: document.body,
      }),
    );
    expect(audio.source.start).toHaveBeenCalledTimes(2);
  });

  it('keeps hover and press cooldowns separate, including a first interaction at time zero', async () => {
    const user = userEvent.setup();
    const audio = mockAudio();
    const now = vi.spyOn(performance, 'now').mockReturnValue(0);
    render(
      <>
        <ButtonSound />
        <button type="button">Open Info</button>
      </>,
    );
    const button = screen.getByRole('button', {name: 'Open Info'});
    await user.hover(button);
    await user.click(button);
    expect(audio.source.start).toHaveBeenCalledTimes(2);
    await user.click(button);
    expect(audio.source.start).toHaveBeenCalledTimes(2);
    now.mockReturnValue(81);
    await user.click(button);
    expect(audio.source.start).toHaveBeenCalledTimes(3);
  });

  it('uses each sound volume and releases its audio nodes when playback ends', async () => {
    const user = userEvent.setup();
    const audio = mockAudio();
    render(
      <>
        <ButtonSound volume={0.2} activateVolume={0.7} />
        <button type="button">Open Info</button>
      </>,
    );
    const button = screen.getByRole('button', {name: 'Open Info'});
    await user.hover(button);
    expect(audio.gain.gain.value).toBe(0.2);
    audio.source.addEventListener.mock.calls[0][1]();
    expect(audio.source.disconnect).toHaveBeenCalledOnce();
    expect(audio.gain.disconnect).toHaveBeenCalledOnce();
    await user.click(button);
    expect(audio.gain.gain.value).toBe(0.7);
    audio.source.addEventListener.mock.calls[1][1]();
    expect(audio.source.disconnect).toHaveBeenCalledTimes(2);
    expect(audio.gain.disconnect).toHaveBeenCalledTimes(2);
  });

  it('does not play after unmount when an audio resume finishes late', async () => {
    const audio = mockAudio();
    audio.context.state = 'suspended';
    let finishResume!: () => void;
    audio.context.resume.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishResume = () => {
            audio.context.state = 'running';
            resolve();
          };
        }),
    );
    const view = render(
      <>
        <ButtonSound />
        <button type="button">Open Info</button>
      </>,
    );
    await waitFor(() =>
      expect(audio.context.decodeAudioData).toHaveBeenCalledTimes(3),
    );
    fireEvent.click(screen.getByRole('button', {name: 'Open Info'}));
    view.unmount();
    await act(async () => {
      finishResume();
    });
    expect(audio.source.start).not.toHaveBeenCalled();
    expect(audio.context.close).toHaveBeenCalledOnce();
  });

  it('keeps press sounds available when loading the hover clip fails', async () => {
    const user = userEvent.setup();
    const audio = mockAudio();
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    audio.fetch.mockResolvedValueOnce({ok: false, status: 404} as Response);
    render(
      <>
        <ButtonSound />
        <button type="button">Open Info</button>
      </>,
    );
    await waitFor(() => expect(warning).toHaveBeenCalledOnce());
    const button = screen.getByRole('button', {name: 'Open Info'});
    await user.hover(button);
    expect(audio.source.start).not.toHaveBeenCalled();
    await user.click(button);
    expect(audio.source.start).toHaveBeenCalledOnce();
  });
});
