import {
  ControllerSymbol,
  type ControllerSymbolName,
} from '~/components/shared/ControllerSymbol';

export type ControllerFooterPosition = 'start' | 'center' | 'end';

export interface ControllerFooterAction {
  label: string;
  symbol: ControllerSymbolName;
  onActivate: () => void;
  ariaLabel?: string;
  count?: number;
  disabled?: boolean;
  position?: ControllerFooterPosition;
}

interface ControllerFooterProps {
  actions: ControllerFooterAction[];
}

export function ControllerFooter({actions}: ControllerFooterProps) {
  const actionsByPosition = {
    start: actions.filter((action) => action.position === 'start'),
    center: actions.filter(
      (action) => !action.position || action.position === 'center',
    ),
    end: actions.filter((action) => action.position === 'end'),
  };

  return (
    <footer
      className={[
        'absolute inset-x-0 bottom-0 z-30',
        'px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-[max(1.25rem,env(safe-area-inset-bottom))]',
        'md:pb-[max(1.75rem,env(safe-area-inset-bottom))]',
      ].join(' ')}
    >
      <div
        aria-label="Screen actions"
        className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center"
        role="toolbar"
      >
        <ControllerFooterGroup
          actions={actionsByPosition.start}
          position="start"
        />
        <ControllerFooterGroup
          actions={actionsByPosition.center}
          position="center"
        />
        <ControllerFooterGroup actions={actionsByPosition.end} position="end" />
      </div>
    </footer>
  );
}

function ControllerFooterGroup({
  actions,
  position,
}: {
  actions: ControllerFooterAction[];
  position: ControllerFooterPosition;
}) {
  const alignment = {
    start: 'justify-self-start',
    center: 'justify-self-center',
    end: 'justify-self-end',
  }[position];

  return (
    <div className={`flex items-center gap-1.5 sm:gap-7 ${alignment}`}>
      {actions.map((action) => {
        const visibleLabel =
          action.count === undefined
            ? action.label
            : `${action.label} (${action.count})`;

        return (
          <button
            key={
              action.ariaLabel ?? `${position}-${action.symbol}-${action.label}`
            }
            aria-label={action.ariaLabel}
            className={[
              'ps2-controller-action flex min-h-9 items-center gap-1 whitespace-nowrap sm:min-h-11 sm:gap-1.5',
              'border-0 bg-transparent p-0',
              'text-[0.625rem] text-ps2-muted sm:text-xs',
              'enabled:cursor-pointer',
              'disabled:cursor-not-allowed disabled:opacity-30',
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
  );
}
