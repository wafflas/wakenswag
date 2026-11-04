import {describe, expect, it} from 'vitest';
import {getControllerBackPath} from '~/components/controller/controllerUtils';
import {getProductListingPageUrl} from '~/components/product-listing/productListingUtils';
import {isTypingTarget} from '~/components/home/homeUtils';
import {getInteractiveElement} from '~/components/shared/sharedUtils';

describe('controller Back destinations', () => {
  it('hides Back on the home menu', () => {
    expect(getControllerBackPath('/')).toBeNull();
  });

  it.each(['/merch/tee', '/merch/tee/'])(
    'returns a directly opened product %s to merch',
    (pathname) => {
      expect(getControllerBackPath(pathname)).toBe('/merch');
    },
  );

  it.each(['/merch', '/drumkits', '/socials', '/info', '/missing'])(
    'returns %s to the main menu',
    (pathname) => {
      expect(getControllerBackPath(pathname)).toBe('/');
    },
  );
});

describe('listing pagination URLs', () => {
  it('preserves unrelated parameters and replaces the previous cursor and direction', () => {
    const result = getProductListingPageUrl({
      pathname: '/drumkits',
      search: '?q=kick+%26+snare&cursor=old&direction=previous',
      direction: 'next',
      cursor: 'new+/=',
    });
    const url = new URL(result, 'https://store.example');
    expect(url.pathname).toBe('/drumkits');
    expect([...url.searchParams.entries()]).toEqual([
      ['q', 'kick & snare'],
      ['cursor', 'new+/='],
      ['direction', 'next'],
    ]);
  });

  it('creates a previous-page URL when no search parameters exist', () => {
    expect(
      getProductListingPageUrl({
        pathname: '/merch',
        search: '',
        direction: 'previous',
        cursor: '0',
      }),
    ).toBe('/merch?direction=previous&cursor=0');
  });
});

describe('keyboard typing targets', () => {
  it.each(['input', 'textarea', 'select'])(
    'leaves %s controls in charge of their keyboard input',
    (tag) => {
      expect(isTypingTarget(document.createElement(tag))).toBe(true);
    },
  );

  it('ignores non-elements and permits navigation from ordinary links', () => {
    const link = document.createElement('a');
    // jsdom does not provide the browser's computed isContentEditable property.
    Object.defineProperty(link, 'isContentEditable', {value: false});
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget(new EventTarget())).toBe(false);
    expect(isTypingTarget(link)).toBe(false);
  });

  it('leaves content-editable elements in charge of their keyboard input', () => {
    const editable = document.createElement('div');
    Object.defineProperty(editable, 'isContentEditable', {value: true});
    expect(isTypingTarget(editable)).toBe(true);
  });
});

describe('interface sound targets', () => {
  it('finds a button when its nested SVG receives the event', () => {
    const button = document.createElement('button');
    button.innerHTML = '<svg><path /></svg>';
    expect(getInteractiveElement(button.querySelector('path'))).toBe(button);
  });

  it.each(['disabled', 'aria-disabled', 'data-hover-sound'])(
    'does not play sound for a control excluded by %s',
    (attribute) => {
      const button = document.createElement('button');
      button.setAttribute(
        attribute,
        attribute === 'data-hover-sound' ? 'off' : 'true',
      );
      expect(getInteractiveElement(button)).toBeNull();
    },
  );

  it('ignores missing targets and links without destinations', () => {
    expect(getInteractiveElement(null)).toBeNull();
    expect(getInteractiveElement(new EventTarget())).toBeNull();
    expect(getInteractiveElement(document.createElement('a'))).toBeNull();
    const link = document.createElement('a');
    link.href = '/merch';
    expect(getInteractiveElement(link)).toBe(link);
  });
});
