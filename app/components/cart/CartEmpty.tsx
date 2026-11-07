import {Link} from 'react-router';
import {useAside} from '../layout/Aside';
import type {CartLayout} from './cartUtils';

export function CartEmpty({
  hidden = false,
  layout,
}: {
  hidden: boolean;
  layout?: CartLayout;
}) {
  const {close} = useAside();

  return (
    <div
      className={[
        'ps2-soft-copy flex flex-col items-center gap-5',
        'text-center text-xl md:text-2xl text-ps2-gray',
      ].join(' ')}
      hidden={hidden}
    >
      <p>Your cart is empty.</p>

      <Link
        className="ps2-cta md:text-2xl"
        to="/swag"
        onClick={layout === 'aside' ? close : undefined}
        prefetch="viewport"
      >
        Browse items
      </Link>
    </div>
  );
}
