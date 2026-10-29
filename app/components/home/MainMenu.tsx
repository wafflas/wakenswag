import {useCallback, useEffect, useRef, useState} from 'react';
import {Link} from 'react-router';

const MENU_ITEMS = [
  {
    label: 'Home',
    to: '/',
  },
  {
    label: 'Merch',
    to: '/merch',
  },
  {
    label: 'Drumkits',
    to: '/drumkits',
  },
  {
    label: 'Socials',
    to: '/socials',
  },
  {
    label: 'Info',
    to: '/info',
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
  const [navigationMode, setNavigationMode] =
    useState<NavigationMode>('directional');

  const selectedIndexRef = useRef(0);
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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isTypingTarget(event.target)) {
        return;
      }

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
          'font-medium',
          'gap-1.25',
        ].join(' ')}
      >
        {MENU_ITEMS.map((item, index) => (
          <li key={item.to}>
            <Link
              aria-current={item.to === '/' ? 'page' : undefined}
              className="ps2-main-menu-link px-3"
              data-selected={selectedIndex === index}
              onFocus={() => selectItem(index)}
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
