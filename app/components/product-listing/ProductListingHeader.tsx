interface ProductListingHeaderProps {
  displayTitle: string;
  storageLabel?: string;
  workspaceLabel?: string;
}

export function ProductListingHeader({
  displayTitle,
  storageLabel = '4.20 MB Taken',
  workspaceLabel = 'Kaif Workspace (SYS)/1',
}: ProductListingHeaderProps) {
  return (
    <header
      className={[
        'relative z-10 flex min-h-20 items-start justify-between gap-2 px-3 pt-4 pb-6',
        'sm:min-h-24 sm:gap-4 sm:px-4 sm:pt-5 sm:pb-8',
        'md:min-h-28 md:gap-8 md:px-7 md:py-9',
        'bg-gradient-to-b from-black/60 to-transparent',
      ].join(' ')}
    >
      <div className="flex-1 text-ps2-white text-ps2-outline md:flex-none">
        <p className="m-0 text-sm leading-none md:text-2xl lg:text-3xl">
          {workspaceLabel}
        </p>
        <p className="m-0 text-sm leading-none md:text-xl lg:text-2xl">
          {storageLabel}
        </p>
      </div>

      <h1
        className={[
          'm-0 flex-1 text-right text-base md:max-w-1/2 md:flex-none md:text-2xl lg:text-3xl',
          'font-medium leading-none tracking-wide text-ps2-yellow text-ps2-outline',
        ].join(' ')}
      >
        {displayTitle}
      </h1>
    </header>
  );
}
