import {isTypingTarget} from './homeUtils';
import {useCallback, useEffect, useRef, useState} from 'react';
import {Link, useLocation} from 'react-router';
import {useAside} from '~/components/layout/Aside';

const MENU_ITEMS = [
  {
    label: 'Home',
    to: '/',
  },
  {
    label: 'Swag',
    to: '/swag',
  },
  {
    label: 'Drumkits',
    to: '/drumkits',
  },
  {
    label: 'Info',
    to: '/info',
  },
] as const;

type NavigationMode = 'directional' | 'pointer' | 'tab';

interface MainMenuProps {
  items?: ReadonlyArray<{
    label: string;
    to: string;
    detail?: string;
    external?: boolean;
  }>;
  ariaLabel?: string;
  variant?: 'home' | 'info';
}

export function MainMenu({
  items = MENU_ITEMS,
  ariaLabel = 'Main navigation',
  variant = 'home',
}: MainMenuProps) {
  const {type} = useAside();
  const {pathname} = useLocation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [navigationMode, setNavigationMode] =
    useState<NavigationMode>('directional');

  const selectedIndexRef = useRef(0);
  const menuRef = useRef<HTMLElement>(null);
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
        (currentIndex + direction + items.length) % items.length;

      selectItem(nextIndex, true);
    },
    [items.length, selectItem],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        type !== 'closed' ||
        event.defaultPrevented ||
        isTypingTarget(event.target)
      ) {
        return;
      }

      if (event.key === 'Tab') {
        setNavigationMode('tab');
        return;
      }

      // Global menu shortcuts must leave focused controls elsewhere alone.
      if (
        event.target instanceof Element &&
        event.target !== document.body &&
        !menuRef.current?.contains(event.target)
      ) {
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
        selectItem(items.length - 1, true);
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [items.length, moveSelection, selectItem, type]);

  return (
    <nav
      ref={menuRef}
      aria-label={ariaLabel}
      className={
        variant === 'info'
          ? 'ps2-main-menu w-[calc(100vw-3rem)] max-w-160 text-left'
          : 'ps2-main-menu'
      }
      data-navigation-mode={navigationMode}
    >
      <ul
        className={
          variant === 'info'
            ? 'grid grid-cols-[minmax(0,1fr)_max-content] text-[clamp(1.4rem,4.6vw,1.75rem)] font-medium lg:text-[clamp(1.5rem,3vw,2rem)]'
            : 'flex flex-col items-center gap-1.25 text-[54px] font-medium md:text-[72px]'
        }
      >
        {items.map((item, index) => (
          <li
            key={item.to}
            className={
              variant === 'info'
                ? 'col-span-full grid grid-cols-subgrid'
                : undefined
            }
          >
            <Link
              aria-current={item.to === pathname ? 'page' : undefined}
              className={
                variant === 'info'
                  ? 'ps2-main-menu-link group col-span-full grid! !min-h-9 grid-cols-subgrid justify-start!'
                  : 'ps2-main-menu-link px-3'
              }
              data-selected={selectedIndex === index}
              onFocus={() => selectItem(index)}
              onPointerEnter={() => selectItem(index)}
              ref={(element) => {
                linkRefs.current[index] = element;
              }}
              to={item.to}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
            >
              <span>{item.label}</span>
              {variant === 'info' && item.detail ? (
                <span className="group-data-[selected=true]:text-ps2-white">
                  {item.detail}
                </span>
              ) : null}
              {item.external ? (
                <span className="sr-only"> (opens in a new tab)</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
