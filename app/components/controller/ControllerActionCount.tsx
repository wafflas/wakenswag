import {useEffect, useRef, useState} from 'react';

export function ControllerActionCount({count}: {count: number}) {
  const previousCountRef = useRef(count);
  const [animationVersion, setAnimationVersion] = useState(0);

  useEffect(() => {
    if (previousCountRef.current === count) return;

    previousCountRef.current = count;
    setAnimationVersion((version) => version + 1);
  }, [count]);

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
      ({count})
    </span>
  );
}
