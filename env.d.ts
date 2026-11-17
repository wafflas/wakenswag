/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
import '@total-typescript/ts-reset';
declare global {
  interface Env {
    PUBLIC_STORE_DOMAIN: string;
    PUBLIC_CHECKOUT_DOMAIN?: string;
    PUBLIC_STOREFRONT_ID?: string;
    PUBLIC_STOREFRONT_API_TOKEN?: string;
    PRIVATE_STOREFRONT_API_TOKEN?: string;
    SESSION_SECRET?: string;
  }
}
