import {useEffect, useState} from 'react';

export function ControllerActionCount({
  count,
  isReady,
}: {
  count: number;
  isReady: boolean;
}) {
  const [{quantity, animationVersion}, setDisplay] = useState({
    quantity: isReady ? count : undefined,
    animationVersion: 0,
  });

  useEffect(() => {
    if (!isReady) return;

    setDisplay((previous) => {
      if (previous.quantity === count) return previous;
      return {
        quantity: count,
        animationVersion:
          previous.animationVersion + (previous.quantity === undefined ? 0 : 1),
      };
    });
  }, [count, isReady]);

  if (quantity === undefined) return null;

  return (
    <span
      key={animationVersion}
      aria-atomic="true"
      aria-live="polite"
      className={[
        'inline-block',
        animationVersion > 0
          ? 'animate-[ping_520ms_var(--ease-ps2)_1] motion-reduce:animate-none'
          : '',
      ].join(' ')}
    >
      ({quantity})
    </span>
  );
}
