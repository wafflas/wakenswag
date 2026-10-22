import {
  getSchema,
  pluckConfig,
  preset,
} from '@shopify/hydrogen-codegen';

export default {
  overwrite: true,
  pluckConfig,
  generates: {
    'storefrontapi.generated.d.ts': {
      preset,
      schema: getSchema('storefront'),
      documents: [
        './*.{js,jsx}',
        './app/**/*.{js,jsx}',
        '!./app/graphql/customer-account/*.{js,jsx}',
      ],
    },
    'customer-accountapi.generated.d.ts': {
      preset,
      schema: getSchema('customer-account'),
      documents: ['./app/graphql/customer-account/*.{js,jsx}'],
    },
  },
};
