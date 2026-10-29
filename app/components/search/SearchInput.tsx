import {forwardRef, type ComponentPropsWithoutRef} from 'react';

export const Input = forwardRef<
  HTMLInputElement,
  ComponentPropsWithoutRef<'input'>
>(function Input({className, type, ...props}, ref) {
  return (
    <input
      {...props}
      ref={ref}
      type={type}
      className={[
        'flex h-10 w-full min-w-0 rounded-md border border-ps2-gray/50 bg-transparent px-3 py-2',
        'font-ps2 text-base text-ps2-white outline-none transition-[color,box-shadow,border-color] duration-200',
        'placeholder:text-ps2-gray disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ps2-cyan focus-visible:ring-1 focus-visible:ring-ps2-cyan/30',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
});
