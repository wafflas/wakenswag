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

const INTERACTIVE_SELECTOR = 'button, a[href]';
const MOBILE_MENU_QUERY = '(max-width: 1023px)';

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

    const audioContext = new AudioContextConstructor();
    const hoverGainNode = audioContext.createGain();
    const activateGainNode = audioContext.createGain();
    const abortController = new AbortController();
    let hoverBuffer: AudioBuffer | null = null;
    let activateBuffer: AudioBuffer | null = null;
    let lastHoverPlayedAt = 0;
    let lastActivatePlayedAt = 0;
    let disposed = false;
    let keyboardNavigationActive = false;

    hoverGainNode.gain.value = volume;
    activateGainNode.gain.value = activateVolume;
    hoverGainNode.connect(audioContext.destination);
    activateGainNode.connect(audioContext.destination);

    async function loadSound(soundSrc: string) {
      const response = await fetch(soundSrc, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Unable to load interface sound (${soundSrc}): ${response.status}`,
        );
      }

      const encodedAudio = await response.arrayBuffer();
      return audioContext.decodeAudioData(encodedAudio);
    }

    function startSound(buffer: AudioBuffer | null, gainNode: GainNode) {
      if (!buffer || disposed || audioContext.state !== 'running') return;

      const sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = buffer;
      sourceNode.connect(gainNode);
      sourceNode.addEventListener('ended', () => sourceNode.disconnect(), {
        once: true,
      });
      sourceNode.start();
    }

    function playHoverSound() {
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

    function playActivateSound() {
      const now = performance.now();

      if (now - lastActivatePlayedAt < cooldownMs) return;
      lastActivatePlayedAt = now;

      if (audioContext.state === 'suspended') {
        void audioContext
          .resume()
          .then(() => startSound(activateBuffer, activateGainNode))
          .catch(() => undefined);
        return;
      }

      startSound(activateBuffer, activateGainNode);
    }

    function unlockAudio() {
      if (audioContext.state === 'suspended') {
        void audioContext.resume().catch(() => undefined);
      }
    }

    function getInteractiveElement(target: EventTarget | null) {
      if (!(target instanceof Element)) return null;

      const interactiveElement =
        target.closest<HTMLElement>(INTERACTIVE_SELECTOR);

      if (
        !interactiveElement ||
        interactiveElement.matches(
          ':disabled, [aria-disabled="true"], [data-hover-sound="off"]',
        )
      ) {
        return null;
      }

      return interactiveElement;
    }

    function handlePointerOver(event: PointerEvent) {
      if (event.pointerType === 'touch') return;
      keyboardNavigationActive = false;

      const interactiveElement = getInteractiveElement(event.target);
      if (!interactiveElement) return;

      if (
        event.relatedTarget instanceof Node &&
        interactiveElement.contains(event.relatedTarget)
      ) {
        return;
      }

      playHoverSound();
    }

    function handleFocusIn(event: FocusEvent) {
      if (!keyboardNavigationActive) return;
      if (!getInteractiveElement(event.target)) return;

      playHoverSound();
    }

    function handlePointerDown(event: PointerEvent) {
      keyboardNavigationActive = false;
      unlockAudio();

      const interactiveElement = getInteractiveElement(event.target);
      if (!interactiveElement) return;

      const isFirstMobileMenuTap =
        event.pointerType === 'touch' &&
        window.matchMedia(MOBILE_MENU_QUERY).matches &&
        interactiveElement.dataset.mobileDoubleTap === 'true' &&
        interactiveElement.dataset.touchArmed !== 'true';

      if (isFirstMobileMenuTap) {
        playHoverSound();
        return;
      }

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

    void loadSound(src)
      .then((buffer) => {
        hoverBuffer = buffer;
      })
      .catch((error: unknown) => {
        if (!abortController.signal.aborted) console.warn(error);
      });

    void loadSound(activateSrc)
      .then((buffer) => {
        activateBuffer = buffer;
      })
      .catch((error: unknown) => {
        if (!abortController.signal.aborted) console.warn(error);
      });

    document.addEventListener('pointerover', handlePointerOver);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('pointerdown', handlePointerDown, {
      capture: true,
    });
    document.addEventListener('keydown', handleKeyDown, {capture: true});

    return () => {
      disposed = true;
      abortController.abort();
      document.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('pointerdown', handlePointerDown, {
        capture: true,
      });
      document.removeEventListener('keydown', handleKeyDown, {capture: true});
      hoverGainNode.disconnect();
      activateGainNode.disconnect();
      void audioContext.close();
    };
  }, [activateSrc, activateVolume, cooldownMs, src, volume]);

  return null;
}
