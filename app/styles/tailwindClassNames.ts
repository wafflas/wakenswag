export const ps2CtaClassName = [
  'text-ps2-cyan/80 transition-[color,opacity,text-shadow] duration-200 ease-ps2',
  'hover:text-ps2-cyan hover:[text-shadow:0_0_8px_rgba(40,200,255,0.3)]',
  'focus-visible:text-ps2-cyan focus-visible:outline-none focus-visible:[text-shadow:0_0_8px_rgba(40,200,255,0.3)]',
  'disabled:cursor-not-allowed disabled:opacity-30 disabled:[text-shadow:none]',
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-30 aria-disabled:[text-shadow:none]',
].join(' ');

export const cartScrollClassName = [
  '[scrollbar-color:#28c8ffb8_#8282821f] [scrollbar-gutter:stable] [scrollbar-width:thin]',
  '[&::-webkit-scrollbar]:w-2.5',
  '[&::-webkit-scrollbar-track]:bg-ps2-gray/10',
  '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[3px]',
  '[&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent',
  '[&::-webkit-scrollbar-thumb]:bg-ps2-cyan/70 [&::-webkit-scrollbar-thumb]:bg-clip-content',
  '[&::-webkit-scrollbar-thumb]:shadow-[0_0_8px_rgba(40,200,255,0.28)]',
  '[&:hover::-webkit-scrollbar-thumb]:bg-ps2-cyan',
  '[&:hover::-webkit-scrollbar-thumb]:shadow-[0_0_10px_rgba(40,200,255,0.5)]',
  '[&::-webkit-scrollbar-corner]:bg-transparent',
].join(' ');
