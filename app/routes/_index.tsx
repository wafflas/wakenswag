import {Suspense, useCallback} from 'react';
import {Await, useNavigate, useRouteLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import type {RootLoader} from '~/root';
import {ControllerFooter} from '~/components/ps2/ControllerFooter';
import {MainMenu} from '~/components/ps2/MainMenu';
import {PS2Shell} from '~/components/ps2/PS2Shell';
import DesktopLogo from '~/components/shared/DesktopLogo';
import Logo from '~/components/shared/Logo';

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: 'Wake n Swag',
    },
    {
      name: 'description',
      content: 'Wake n Swag merch, drumkits, archive, and information.',
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context}: Route.LoaderArgs) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
  ]);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    featuredCollection: collections.nodes[0],
  };
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  return {recommendedProducts};
}

export default function Homepage() {
  const navigate = useNavigate();

  const openCart = useCallback(() => {
    void navigate('/cart');
  }, [navigate]);

  return (
    <PS2Shell footer={<HomepageFooter onOpenCart={openCart} />}>
      <div
        className={[
          'flex min-h-dvh flex-col items-center justify-center',
          'gap-10 overflow-hidden pb-24',
          'lg:flex-row lg:gap-[clamp(3rem,8vw,10rem)]',
        ].join(' ')}
      >
        <div className="flex shrink-0 items-center justify-center">
          <Logo />
          <DesktopLogo />
        </div>

        <div className="flex shrink-0 items-center justify-center">
          <MainMenu />
        </div>
      </div>
    </PS2Shell>
  );
}

interface HomepageFooterProps {
  onOpenCart: () => void;
}

function HomepageFooter({onOpenCart}: HomepageFooterProps) {
  const rootData = useRouteLoaderData<RootLoader>('root');

  const fallback = (
    <ControllerFooter
      actions={[
        {
          count: 0,
          label: 'Cart',
          onActivate: onOpenCart,
          symbol: 'square',
        },
      ]}
    />
  );

  if (!rootData) {
    return fallback;
  }

  return (
    <Suspense fallback={fallback}>
      <Await resolve={rootData.cart}>
        {(cart) => (
          <ControllerFooter
            actions={[
              {
                count: cart?.totalQuantity ?? 0,
                label: 'Cart',
                onActivate: onOpenCart,
                symbol: 'square',
              },
            ]}
          />
        )}
      </Await>
    </Suspense>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
