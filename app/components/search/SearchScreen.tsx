import {useEffect, useRef, useState} from 'react';
import {
  usePredictiveSearch,
  usePredictiveSearchActions,
} from '@shopify/hydrogen/react';
import type {PredictiveSearchData} from '~/lib/predictiveSearch.server';
import {normalizeSearchProduct} from './searchUtils';
import {SearchProductItem} from './SearchProductItem';
import {SearchInput} from '~/components/search/SearchInput';

interface SearchScreenProps {
  onClose: () => void;
}

export function SearchScreen({onClose}: SearchScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const {status, result, error} = usePredictiveSearch<PredictiveSearchData>();
  const {search, clear} = usePredictiveSearchActions();
  const trimmedQuery = query.trim();
  const predictive =
    result.term === trimmedQuery && status === 'success' ? result : null;
  const products = predictive?.items.products.map(normalizeSearchProduct) ?? [];
  const showEmptyPrompt = trimmedQuery.length === 0;
  const showNoResults = predictive !== null && products.length === 0;
  const isScanning = !showEmptyPrompt && status !== 'error' && !predictive;

  let statusMessage: string | null = null;
  if (showEmptyPrompt) {
    statusMessage = 'Insert search term';
  } else if (isScanning && products.length === 0) {
    statusMessage = 'Scanning memory...';
  } else if (showNoResults) {
    statusMessage = 'No memory found';
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => () => clear(), [clear]);

  return (
    <section
      aria-labelledby="search-browser-title"
      className="relative flex h-dvh w-full flex-col overflow-hidden px-3 pb-16 sm:pb-18 md:pb-20"
    >
      <h2
        className="ps2-soft-copy shrink-0 pt-20 text-center text-3xl leading-none tracking-wide text-ps2-yellow sm:pt-24 sm:text-4xl"
        id="search-browser-title"
      >
        Search
      </h2>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-4 py-6 sm:gap-6 sm:py-8">
        <form
          className="w-full max-w-2xl shrink-0"
          onSubmit={(event) => {
            event.preventDefault();
          }}
          role="search"
        >
          <SearchInput
            aria-label="Search memory"
            autoComplete="off"
            autoCorrect="off"
            className={[
              'h-13 rounded-sm border-ps2-gray/60 bg-black/60 px-4 py-3',
              'text-lg leading-tight tracking-wide text-ps2-white',
              'hover:border-ps2-cyan/50 focus-visible:shadow-[0_0_18px_rgba(40,200,255,0.22)]',
              '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
              'lg:h-15 lg:text-2xl',
            ].join(' ')}
            enterKeyHint="search"
            name="q"
            onChange={(event) => {
              const value = event.currentTarget.value;
              setQuery(value);
              void search(value);
            }}
            placeholder="Search memory..."
            ref={inputRef}
            spellCheck={false}
            type="search"
            value={query}
          />
        </form>

        <div className="flex min-h-0 w-full max-w-2xl flex-1">
          {statusMessage ? (
            <p
              role="status"
              className="grid w-full flex-1 place-items-center rounded-md border border-ps2-gray/20 text-center text-sm tracking-widest text-ps2-gray sm:text-base"
            >
              {statusMessage}
            </p>
          ) : null}

          {error ? (
            <div
              className="flex w-full flex-col items-center justify-center gap-4"
              role="alert"
            >
              <p>{error}</p>
              <button
                className="ps2-cta"
                type="button"
                onClick={() => {
                  void search(trimmedQuery);
                }}
              >
                Try again
              </button>
            </div>
          ) : null}

          {products.length > 0 ? (
            <ul
              aria-label="Search results"
              className="cart-scroll grid min-h-0 w-full flex-1 grid-cols-2 items-start gap-x-4 gap-y-6 overflow-y-auto overscroll-contain rounded-md border border-ps2-gray/20 p-3 sm:grid-cols-2"
            >
              {products.map((product) => (
                <SearchProductItem
                  key={product.id}
                  onNavigate={onClose}
                  product={product}
                  term={trimmedQuery}
                />
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
