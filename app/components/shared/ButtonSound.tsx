import {getInteractiveElement} from './sharedUtils';
import {useEffect} from 'react';

interface ButtonSoundProps {
  src?: string;
  activateSrc?: string;
  volume?: number;
  activateVolume?: number;
  cooldownMs?: number;
}

type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export function ButtonSound({
  src = '/audio/select.mp3',
  activateSrc = '/audio/select-choice.mp3',
  volume = 0.4,
  activateVolume = 0.65,
  cooldownMs = 80,
}: ButtonSoundProps) {
  useEffect(() => {
    const AudioContextConstructor =
      window.AudioContext ??
      (window as WindowWithWebkitAudio).webkitAudioContext;

    if (!AudioContextConstructor) return undefined;

    let audioContext: AudioContext | undefined;
    let hoverGainNode: GainNode | undefined;
    let activateGainNode: GainNode | undefined;
    let activateReady: Promise<void> | undefined;
    const abortController = new AbortController();
    let hoverBuffer: AudioBuffer | null = null;
    let activateBuffer: AudioBuffer | null = null;
    let lastHoverPlayedAt = 0;
    let lastActivatePlayedAt = 0;
    let disposed = false;
    let keyboardNavigationActive = false;
    let activeHoverElement: HTMLElement | null = null;

    async function loadSound(soundSrc: string, context: AudioContext) {
      const response = await fetch(soundSrc, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Unable to load interface sound (${soundSrc}): ${response.status}`,
        );
      }

      const encodedAudio = await response.arrayBuffer();
      return context.decodeAudioData(encodedAudio);
    }

    function initializeAudio() {
      if (audioContext) return;
      const context = new AudioContextConstructor();
      audioContext = context;
      hoverGainNode = context.createGain();
      activateGainNode = context.createGain();
      hoverGainNode.gain.value = volume;
      activateGainNode.gain.value = activateVolume;
      hoverGainNode.connect(context.destination);
      activateGainNode.connect(context.destination);

      void loadSound(src, context)
        .then((buffer) => {
          hoverBuffer = buffer;
        })
        .catch((error: unknown) => {
          if (!abortController.signal.aborted) console.warn(error);
        });

      activateReady = loadSound(activateSrc, context)
        .then((buffer) => {
          activateBuffer = buffer;
        })
        .catch((error: unknown) => {
          if (!abortController.signal.aborted) console.warn(error);
        });
    }

    function startSound(
      buffer: AudioBuffer | null,
      gainNode: GainNode | undefined,
    ) {
      if (
        !buffer ||
        !gainNode ||
        disposed ||
        audioContext?.state !== 'running'
      ) {
        return;
      }

      const sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = buffer;
      sourceNode.connect(gainNode);
      sourceNode.addEventListener('ended', () => sourceNode.disconnect(), {
        once: true,
      });
      sourceNode.start();
    }

    function playHoverSound() {
      if (!audioContext) return;
      const now = performance.now();

      if (now - lastHoverPlayedAt < cooldownMs) return;
      lastHoverPlayedAt = now;

      if (audioContext.state === 'suspended') {
        void audioContext
          .resume()
          .then(() => startSound(hoverBuffer, hoverGainNode))
          .catch(() => undefined);
        return;
      }

      startSound(hoverBuffer, hoverGainNode);
    }

    function playHoverForElement(interactiveElement: HTMLElement) {
      if (activeHoverElement === interactiveElement) return;

      activeHoverElement = interactiveElement;
      playHoverSound();
    }

    function clearHoverElement(
      target: EventTarget | null,
      relatedTarget: EventTarget | null,
    ) {
      const interactiveElement = getInteractiveElement(target);
      if (!interactiveElement || activeHoverElement !== interactiveElement) {
        return;
      }

      if (
        relatedTarget instanceof Node &&
        interactiveElement.contains(relatedTarget)
      ) {
        return;
      }

      activeHoverElement = null;
    }

    function playActivateSound() {
      if (!audioContext) return;
      const now = performance.now();

      if (now - lastActivatePlayedAt < cooldownMs) return;
      lastActivatePlayedAt = now;

      // The first gesture starts loading too; play its sound once decoding and
      // any required resume have both finished.
      void Promise.all([
        activateReady,
        audioContext.state === 'suspended' ? audioContext.resume() : undefined,
      ])
        .then(() => startSound(activateBuffer, activateGainNode))
        .catch(() => undefined);
    }

    function unlockAudio() {
      initializeAudio();
      if (audioContext?.state === 'suspended') {
        void audioContext.resume().catch(() => undefined);
      }
    }

    function handlePointerOver(event: PointerEvent) {
      if (event.pointerType === 'touch') return;
      keyboardNavigationActive = false;

      const interactiveElement = getInteractiveElement(event.target);
      if (!interactiveElement) return;

      if (
        interactiveElement.contains(document.activeElement) ||
        (event.relatedTarget instanceof Node &&
          interactiveElement.contains(event.relatedTarget))
      ) {
        return;
      }

      playHoverForElement(interactiveElement);
    }

    function handlePointerOut(event: PointerEvent) {
      if (event.pointerType === 'touch') return;

      clearHoverElement(event.target, event.relatedTarget);
    }

    function handleFocusIn(event: FocusEvent) {
      if (!keyboardNavigationActive) return;
      const interactiveElement = getInteractiveElement(event.target);
      if (!interactiveElement) return;

      playHoverForElement(interactiveElement);
    }

    function handleFocusOut(event: FocusEvent) {
      clearHoverElement(event.target, event.relatedTarget);
    }

    function handlePointerDown(event: PointerEvent) {
      keyboardNavigationActive = false;
      unlockAudio();

      const interactiveElement = getInteractiveElement(event.target);
      if (!interactiveElement) return;

      playActivateSound();
    }

    function handleKeyDown(event: KeyboardEvent) {
      keyboardNavigationActive = true;
      unlockAudio();

      if (event.repeat) return;

      const interactiveElement = getInteractiveElement(event.target);
      if (!interactiveElement) return;

      const isEnterActivation = event.key === 'Enter';
      const isButtonSpaceActivation =
        event.key === ' ' && interactiveElement.tagName === 'BUTTON';

      if (isEnterActivation || isButtonSpaceActivation) {
        playActivateSound();
      }
    }

    document.addEventListener('pointerover', handlePointerOver);
    document.addEventListener('pointerout', handlePointerOut);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    document.addEventListener('pointerdown', handlePointerDown, {
      capture: true,
    });
    document.addEventListener('keydown', handleKeyDown, {capture: true});

    return () => {
      disposed = true;
      abortController.abort();
      document.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('pointerout', handlePointerOut);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('pointerdown', handlePointerDown, {
        capture: true,
      });
      document.removeEventListener('keydown', handleKeyDown, {capture: true});
      hoverGainNode?.disconnect();
      activateGainNode?.disconnect();
      void audioContext?.close().catch(() => undefined);
    };
  }, [activateSrc, activateVolume, cooldownMs, src, volume]);

  return null;
}
