const INTERACTIVE_SELECTOR = 'button, a[href]';

export function getInteractiveElement(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;

  const interactiveElement = target.closest<HTMLElement>(INTERACTIVE_SELECTOR);

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
