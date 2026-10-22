import type {CodegenConfig} from '@graphql-codegen/cli';
import {
  getSchema,
  pluckConfig,
  preset,
} from '@shopify/hydrogen-codegen';

export default {
  overwrite: true,
  pluckConfig: pluckConfig as CodegenConfig['pluckConfig'],
  generates: {
    'storefrontapi.generated.d.ts': {
      preset,
      schema: getSchema('storefront'),
      documents: [
        './*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        '!./app/graphql/customer-account/*.{ts,tsx}',
      ],
    },
    'customer-accountapi.generated.d.ts': {
      preset,
      schema: getSchema('customer-account'),
      documents: ['./app/graphql/customer-account/*.{ts,tsx}'],
    },
  },
} satisfies CodegenConfig;
