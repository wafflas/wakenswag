import {Link, useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';
import {PageLayout} from '~/components/layout/PageLayout';

export function NotFoundPage() {
  const rootData = useRouteLoaderData<RootLoader>('root');

  return (
    <PageLayout cart={rootData?.cart ?? Promise.resolve(null)}>
      <div
        className={[
          'relative isolate flex min-h-dvh flex-col items-center justify-center',
          'overflow-hidden px-6 font-ps2 text-ps2-white',
          '[background:linear-gradient(140deg,#c4c4c4_0%,#757575_40%,#303030_80%,#151515_100%)]',
        ].join(' ')}
      >
        <p className="text-ps2-outline text-6xl text-ps2-yellow lg:text-8xl">
          404
        </p>

        <p className="ps2-soft-copy  text-center text-xl text-ps2-muted lg:text-2xl">
          Page not found
        </p>

        <Link to="/" className="ps2-cta text-center text-xl lg:text-2xl">
          Return to the main menu
        </Link>
      </div>
    </PageLayout>
  );
}
