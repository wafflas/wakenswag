import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {Link} from 'react-router';

const MOBILE_MENU_QUERY = '(max-width: 1023px)';

const MENU_ITEMS = [
  {
    label: 'Home',
    to: '/',
  },
  {
    label: 'Merch',
    to: '/collections/merch',
  },
  {
    label: 'Drumkits',
    to: '/collections/drumkits',
  },
  {
    label: 'Archive',
    to: '/pages/archive',
  },
  {
    label: 'Socials',
    to: '/pages/socials',
  },
  {
    label: 'Info',
    to: '/pages/info',
  },
] as const;

type NavigationMode = 'directional' | 'pointer' | 'tab';

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  );
}

export function MainMenu() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [touchArmedIndex, setTouchArmedIndex] = useState<number | null>(null);
  const [navigationMode, setNavigationMode] =
    useState<NavigationMode>('directional');

  const selectedIndexRef = useRef(0);
  const touchArmedIndexRef = useRef<number | null>(null);
  const isMobileTouchPressRef = useRef(false);
  const shouldActivateTouchRef = useRef(false);
  const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const selectItem = useCallback((index: number, moveFocus = false) => {
    selectedIndexRef.current = index;
    setSelectedIndex(index);

    if (moveFocus) {
      linkRefs.current[index]?.focus();
    }
  }, []);

  const moveSelection = useCallback(
    (direction: -1 | 1) => {
      const currentIndex = selectedIndexRef.current;
      const nextIndex =
        (currentIndex + direction + MENU_ITEMS.length) % MENU_ITEMS.length;

      selectItem(nextIndex, true);
    },
    [selectItem],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLAnchorElement>, index: number) => {
      const isMobileTouch =
        event.pointerType === 'touch' &&
        window.matchMedia(MOBILE_MENU_QUERY).matches;

      isMobileTouchPressRef.current = isMobileTouch;

      if (!isMobileTouch) {
        shouldActivateTouchRef.current = false;
        touchArmedIndexRef.current = null;
        setTouchArmedIndex(null);
        return;
      }

      const isSecondTap = touchArmedIndexRef.current === index;
      shouldActivateTouchRef.current = isSecondTap;

      if (!isSecondTap) {
        touchArmedIndexRef.current = index;
        setTouchArmedIndex(index);
        selectItem(index);
      }
    },
    [selectItem],
  );

  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLAnchorElement>) => {
      if (isMobileTouchPressRef.current && !shouldActivateTouchRef.current) {
        event.preventDefault();
      }

      isMobileTouchPressRef.current = false;
      shouldActivateTouchRef.current = false;
    },
    [],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isTypingTarget(event.target)) return;

      if (event.key === 'Tab') {
        setNavigationMode('tab');
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setNavigationMode('directional');
        moveSelection(-1);
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setNavigationMode('directional');
        moveSelection(1);
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        setNavigationMode('directional');
        selectItem(0, true);
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        setNavigationMode('directional');
        selectItem(MENU_ITEMS.length - 1, true);
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moveSelection, selectItem]);
  return (
    <nav
      aria-label="Main navigation"
      className="ps2-main-menu"
      data-navigation-mode={navigationMode}
    >
      <ul
        className={[
          'flex flex-col items-center',
          'text-[54px]',
          'font-medium ',
          'gap-1.25',
        ].join(' ')}
      >
        {MENU_ITEMS.map((item, index) => (
          <li key={item.to}>
            <Link
              aria-current={item.to === '/' ? 'page' : undefined}
              className="ps2-main-menu-link px-3"
              data-mobile-double-tap="true"
              data-selected={selectedIndex === index}
              data-touch-armed={touchArmedIndex === index}
              onClick={handleClick}
              onFocus={() => selectItem(index)}
              onPointerDown={(event) => handlePointerDown(event, index)}
              onPointerEnter={() => selectItem(index)}
              ref={(element) => {
                linkRefs.current[index] = element;
              }}
              to={item.to}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
