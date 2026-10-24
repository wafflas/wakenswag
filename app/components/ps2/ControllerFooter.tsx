import {Link} from 'react-router';
import {
  ControllerSymbol,
  type ControllerSymbolName,
} from '~/components/ps2/ControllerSymbol';

export interface ControllerFooterAction {
  label: string;
  symbol: ControllerSymbolName;
  onActivate: () => void;
  ariaLabel?: string;
  count?: number;
  disabled?: boolean;
}

interface ControllerFooterProps {
  actions: ControllerFooterAction[];
}

export function ControllerFooter({actions}: ControllerFooterProps) {
  return (
    <footer
      className={[
        'absolute inset-x-0 bottom-0 z-30',
        'px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]',
        'md:pb-[max(1.75rem,env(safe-area-inset-bottom))]',
      ].join(' ')}
    >
      <div
        aria-label="Screen actions"
        className="flex items-center justify-center gap-5 sm:gap-7"
        role="toolbar"
      >
        {actions.map((action) => {
          const visibleLabel =
            action.count === undefined
              ? action.label
              : `${action.label} (${action.count})`;
          return (
            <button
              key={action.ariaLabel ?? visibleLabel}
              aria-label={action.ariaLabel}
              className={[
                'flex min-h-11 items-center gap-1.5',
                'border-0 bg-transparent p-0',
                'text-[0.68rem] text-ps2-muted',
                'enabled:cursor-pointer',
                'disabled:cursor-not-allowed disabled:opacity-30',
                'sm:text-xs',
              ].join(' ')}
              disabled={action.disabled}
              onClick={action.onActivate}
            >
              <ControllerSymbol symbol={action.symbol} />
              <span>{visibleLabel}</span>
            </button>
          );
        })}
      </div>
    </footer>
  );
}
