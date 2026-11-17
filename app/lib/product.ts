import {createProductComponents} from '@shopify/hydrogen/react';
import type {ProductFragment} from './productDetail';
export const {ProductProvider, useProductForm} =
  createProductComponents<ProductFragment>();
