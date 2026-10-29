import {useEffect, useRef, useState} from 'react';
import {useFetcher} from 'react-router';
import {Analytics} from '@shopify/hydrogen';
import {type PredictiveSearchReturn} from '~/lib/search';
import {normalizeSearchProduct} from './normalizeSearchProduct';
import {SearchProductItem} from './SearchProductItem';
import {cartScrollClassName} from '~/styles/tailwindClassNames';
import {Input} from '~/components/ui/input';

const SEARCH_ENDPOINT = '/search';
const PREDICTIVE_LIMIT = 8;
const DEBOUNCE_MS = 220;

interface SearchScreenProps {
  onClose: () => void;
}

export function SearchScreen({onClose}: SearchScreenProps) {
  const fetcher = useFetcher<PredictiveSearchReturn>({key: 'search'});
  const inputRef = useRef<HTMLInputElement>(null);
  const fetcherLoadRef = useRef(fetcher.load);
  fetcherLoadRef.current = fetcher.load;

  const [query, setQuery] = useState('');

  const trimmedQuery = query.trim();
  const isPredictivePending = fetcher.state !== 'idle';

  const predictive =
    fetcher.data?.type === 'predictive' &&
    fetcher.data.term === trimmedQuery &&
    trimmedQuery.length > 0
      ? fetcher.data.result
      : null;

  const products = predictive?.items.products.map(normalizeSearchProduct) ?? [];
  const showEmptyPrompt = trimmedQuery.length === 0;
  const showNoResults =
    !isPredictivePending && predictive !== null && products.length === 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!trimmedQuery) return;

    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams({
        q: trimmedQuery,
        limit: String(PREDICTIVE_LIMIT),
      });

      void fetcherLoadRef.current(`${SEARCH_ENDPOINT}?${params}`);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [trimmedQuery]);

  const selectSuggestion = (suggestion: string) => {
    if (inputRef.current) {
      inputRef.current.value = suggestion;
      inputRef.current.focus();
    }

    setQuery(suggestion);
  };

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
          <Input
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
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search memory..."
            ref={inputRef}
            spellCheck={false}
            type="search"
          />
        </form>

        <div className="flex min-h-0 w-full max-w-2xl flex-1">
          {showEmptyPrompt ? (
            <SearchStatusMessage>Insert search term</SearchStatusMessage>
          ) : null}

          {!showEmptyPrompt && isPredictivePending && products.length === 0 ? (
            <SearchStatusMessage>Scanning memory...</SearchStatusMessage>
          ) : null}

          {showNoResults ? (
            <SearchStatusMessage>No memory found</SearchStatusMessage>
          ) : null}

          {products.length > 0 ? (
            <ul
              aria-label="Search results"
              className={`${cartScrollClassName} grid min-h-0 w-full flex-1 grid-cols-2 items-start gap-x-4 gap-y-6 overflow-y-auto overscroll-contain rounded-md border border-ps2-gray/20 p-3 sm:grid-cols-2`}
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

      {trimmedQuery && predictive ? (
        <Analytics.SearchView
          data={{
            searchTerm: trimmedQuery,
            searchResults: {
              total: predictive.total,
              items: {
                products: {
                  nodes: predictive.items.products,
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: null,
                    endCursor: null,
                  },
                },
              },
            },
          }}
        />
      ) : null}
    </section>
  );
}

function SearchStatusMessage({children}: {children: string}) {
  return (
    <p className="grid w-full flex-1 place-items-center rounded-md border border-ps2-gray/20 text-center text-sm tracking-widest text-ps2-gray sm:text-base">
      {children}
    </p>
  );
}
