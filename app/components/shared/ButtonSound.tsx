import {useEffect} from 'react';
import {getInteractiveElement} from './sharedUtils';

interface ButtonSoundProps {
  src?: string;
  activateSrc?: string;
  backActivateSrc?: string;
  volume?: number;
  activateVolume?: number;
  cooldownMs?: number;
}

type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export function ButtonSound({
  src = '/audio/selectzukah.mp3',
  activateSrc = '/audio/selectchoicezukah.mp3',
  backActivateSrc = '/audio/select-choice.mp3',
  volume = 0.4,
  activateVolume = 0.65,
  cooldownMs = 80,
}: ButtonSoundProps) {
  useEffect(() => {
    const AudioContextConstructor =
      window.AudioContext ??
      (window as WindowWithWebkitAudio).webkitAudioContext;

    if (!AudioContextConstructor) return undefined;

    const audioContext = new AudioContextConstructor();
    const abortController = new AbortController();
    const {signal} = abortController;
    const buffers = new Map<string, AudioBuffer>();
    const lastPlayedAt = {hover: -Infinity, activate: -Infinity};
    let keyboardNavigationActive = false;
    let activeHoverElement: HTMLElement | null = null;

    async function loadSound(soundSrc: string) {
      try {
        const response = await fetch(soundSrc, {signal});
        if (!response.ok) {
          throw new Error(
            `Unable to load interface sound (${soundSrc}): ${response.status}`,
          );
        }
        const buffer = await audioContext.decodeAudioData(
          await response.arrayBuffer(),
        );
        buffers.set(soundSrc, buffer);
      } catch (error) {
        if (!signal.aborted) console.warn(error);
      }
    }

    // Cache each clip before interaction; loading never starts playback.
    for (const soundSrc of [src, activateSrc, backActivateSrc]) {
      void loadSound(soundSrc);
    }

    function playSound(
      buffer: AudioBuffer | undefined,
      kind: 'hover' | 'activate',
    ) {
      if (!buffer || signal.aborted || audioContext.state !== 'running') {
        return;
      }
      const now = performance.now();
      if (now - lastPlayedAt[kind] < cooldownMs) return;
      lastPlayedAt[kind] = now;

      const sourceNode = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      gainNode.gain.value = kind === 'hover' ? volume : activateVolume;
      sourceNode.buffer = buffer;
      sourceNode.connect(gainNode);
      gainNode.connect(audioContext.destination);
      sourceNode.addEventListener(
        'ended',
        () => {
          sourceNode.disconnect();
          gainNode.disconnect();
        },
        {once: true},
      );
      sourceNode.start();
    }

    function unlockAudio() {
      if (audioContext.state !== 'running') {
        return audioContext.resume().catch(() => undefined);
      }
      return Promise.resolve();
    }

    function handleHover(event: PointerEvent | FocusEvent) {
      if ('pointerType' in event && event.pointerType === 'touch') return;
      const isPointer = event.type === 'pointerover';
      if (isPointer) keyboardNavigationActive = false;
      if (!isPointer && !keyboardNavigationActive) return;

      const interactiveElement = getInteractiveElement(event.target);
      if (
        !interactiveElement ||
        interactiveElement === activeHoverElement ||
        (isPointer && interactiveElement.contains(document.activeElement)) ||
        (event.relatedTarget instanceof Node &&
          interactiveElement.contains(event.relatedTarget))
      ) {
        return;
      }

      activeHoverElement = interactiveElement;
      playSound(buffers.get(src), 'hover');
    }

    function handleLeave(event: PointerEvent | FocusEvent) {
      if ('pointerType' in event && event.pointerType === 'touch') return;
      const interactiveElement = getInteractiveElement(event.target);
      if (!interactiveElement || interactiveElement !== activeHoverElement) {
        return;
      }
      if (
        event.relatedTarget instanceof Node &&
        interactiveElement.contains(event.relatedTarget)
      ) {
        return;
      }
      activeHoverElement = null;
    }

    function handleInput(event: Event) {
      keyboardNavigationActive = event.type === 'keydown';
      if (keyboardNavigationActive) void unlockAudio();
    }

    function handleClick(event: MouseEvent) {
      // A completed click also covers touch taps and native keyboard activation.
      const resumed = unlockAudio();
      const interactiveElement = getInteractiveElement(event.target);
      if (!interactiveElement) return;

      const buffer = buffers.get(
        interactiveElement.dataset.activateSound === 'back'
          ? backActivateSrc
          : activateSrc,
      );
      // Skip unready clips instead of replaying old presses after a slow load.
      if (!buffer) return;
      void resumed
        .then(() => playSound(buffer, 'activate'))
        .catch(() => undefined);
    }

    document.addEventListener('pointerover', handleHover, {signal});
    document.addEventListener('focusin', handleHover, {signal});
    document.addEventListener('pointerout', handleLeave, {signal});
    document.addEventListener('focusout', handleLeave, {signal});
    document.addEventListener('pointerdown', handleInput, {
      capture: true,
      signal,
    });
    document.addEventListener('keydown', handleInput, {capture: true, signal});
    document.addEventListener('click', handleClick, {capture: true, signal});

    return () => {
      abortController.abort();
      void audioContext.close().catch(() => undefined);
    };
  }, [activateSrc, activateVolume, backActivateSrc, cooldownMs, src, volume]);

  return null;
}
