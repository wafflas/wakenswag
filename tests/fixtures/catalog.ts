import type {
  CartApiQueryFragment,
  ProductFragment,
} from 'storefrontapi.generated';

export function createVariant(size = 'Small', availableForSale = true) {
  return {
    id: `gid://shopify/ProductVariant/${size === 'Small' ? '101' : '102'}`,
    title: size,
    sku: `TEE-${size.toUpperCase()}`,
    availableForSale,
    quantityAvailable: availableForSale ? 3 : 0,
    selectedOptions: [{name: 'Size', value: size}],
    price: {
      amount: size === 'Small' ? '25.00' : '30.00',
      currencyCode: 'EUR' as const,
    },
    compareAtPrice: null,
    unitPrice: null,
    image: {
      __typename: 'Image' as const,
      id: 'image-1',
      url: 'https://cdn.shopify.com/fixture.svg',
      altText: 'Fixture tee',
      width: 400,
      height: 400,
    },
    product: {
      id: 'gid://shopify/Product/1',
      title: 'Fixture Tee',
      handle: 'fixture-tee',
    },
  };
}

export function createProduct(
  overrides: Partial<ProductFragment> = {},
): ProductFragment {
  const small = createVariant();
  const large = createVariant('Large');
  return {
    id: 'gid://shopify/Product/1',
    title: 'Fixture Tee',
    handle: 'fixture-tee',
    vendor: 'Wake n Swag',
    description: 'Soft cotton tee',
    productType: 'Swag',
    collections: {nodes: [{handle: 'swag'}]},
    descriptionHtml: '<ul><li>Soft cotton tee</li></ul>',
    seo: {title: '', description: ''},
    encodedVariantExistence: 'v1_0-1',
    encodedVariantAvailability: 'v1_0-1',
    selectedOrFirstAvailableVariant: small,
    adjacentVariants: [large],
    options: [
      {
        name: 'Size',
        optionValues: [small, large].map((variant) => ({
          name: variant.title,
          firstSelectableVariant: variant,
          swatch: null,
        })),
      },
    ],
    ...overrides,
  };
}

export function createProductCard(index = 1) {
  const product = createProduct();
  return {
    id: `gid://shopify/Product/${index}`,
    handle: index === 1 ? product.handle : `fixture-tee-${index}`,
    title: index === 1 ? product.title : `Fixture Tee ${index}`,
    description: product.description,
    featuredImage: product.selectedOrFirstAvailableVariant?.image ?? null,
    priceRange: {
      minVariantPrice: createVariant().price,
      maxVariantPrice: createVariant('Large').price,
    },
  };
}

export function createCart(quantity = 1): CartApiQueryFragment {
  const variant = createVariant();
  const amount = {amount: String(25 * quantity), currencyCode: 'EUR' as const};
  return {
    id: 'gid://shopify/Cart/fixture',
    updatedAt: '2026-11-04T00:00:00Z',
    checkoutUrl: 'https://checkout.example.test/cart/fixture',
    totalQuantity: quantity,
    lines: {
      nodes: quantity
        ? [
            {
              id: 'gid://shopify/CartLine/fixture',
              quantity,
              attributes: [],
              parentRelationship: null,
              merchandise: {
                ...variant,
                requiresShipping: true,
                product: {
                  ...variant.product,
                  id: 'gid://shopify/Product/1',
                  vendor: 'Wake n Swag',
                  productType: 'Swag',
                  collections: {nodes: [{handle: 'swag'}]},
                },
              },
              cost: {
                totalAmount: amount,
                amountPerQuantity: variant.price,
                compareAtAmountPerQuantity: null,
              },
            },
          ]
        : [],
    },
    cost: {
      subtotalAmount: amount,
      totalAmount: amount,
      totalTaxAmount: null,
      totalDutyAmount: null,
    },
    discountCodes: [],
    appliedGiftCards: [],
    buyerIdentity: {
      countryCode: 'US',
      customer: null,
      email: null,
      phone: null,
    },
    note: null,
    attributes: [],
  };
}

export function createDrumkitVariant() {
  const variant = createVariant();
  return {
    ...variant,
    id: 'gid://shopify/ProductVariant/201',
    title: 'Default Title',
    selectedOptions: [{name: 'Title', value: 'Default Title'}],
    price: {amount: '10.00', currencyCode: 'EUR' as const},
    product: {
      id: 'gid://shopify/Product/2',
      title: 'Fixture Drumkit',
      handle: 'fixture-drumkit',
    },
  };
}

export function createDrumkitCart(quantity = 1): CartApiQueryFragment {
  const cart = createCart(quantity);
  const variant = createDrumkitVariant();
  const amount = {amount: String(10 * quantity), currencyCode: 'EUR' as const};
  if (cart.lines.nodes[0]) {
    cart.lines.nodes[0].merchandise = {
      ...variant,
      requiresShipping: false,
      product: {
        ...variant.product,
        vendor: 'Wake n Swag',
        productType: '',
        collections: {nodes: [{handle: 'drumkits'}]},
      },
    };
    cart.lines.nodes[0].cost.totalAmount = amount;
    cart.lines.nodes[0].cost.amountPerQuantity = variant.price;
  }
  cart.cost.subtotalAmount = amount;
  cart.cost.totalAmount = amount;
  return cart;
}
