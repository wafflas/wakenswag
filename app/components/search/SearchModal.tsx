import {PredictiveSearchProvider} from '@shopify/hydrogen/react';
import {useAside} from '~/components/layout/Aside';
import {SearchScreen} from './SearchScreen';
import {StorefrontDialog} from '~/components/layout/StorefrontDialog';

export function SearchModal() {
  const {close, isExiting, type, openerRef} = useAside();
  const isOpen = type === 'search';

  if (!isOpen) return null;

  return (
    <StorefrontDialog
      title="System browser search"
      onClose={close}
      openerRef={openerRef}
      className="fixed inset-0 z-40 h-dvh overflow-hidden bg-[rgba(6,6,6,0.95)] font-ps2 text-ps2-muted"
      isExiting={isExiting}
    >
      <PredictiveSearchProvider
        debounceInMs={220}
        limit={8}
        types={['PRODUCT', 'QUERY']}
      >
        <SearchScreen onClose={close} />
      </PredictiveSearchProvider>
    </StorefrontDialog>
  );
}
