import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

/** Display Shopify amounts; calculations and totals remain on Shopify. */
export function formatMoneyAmount({
  amount,
  currencyCode,
}: Pick<MoneyV2, 'amount' | 'currencyCode'>) {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
  })
    .formatToParts(Number(amount))
    .filter((part) => part.type !== 'currency' && part.type !== 'literal')
    .map((part) => part.value)
    .join('');
}

export function formatMoney(money: Pick<MoneyV2, 'amount' | 'currencyCode'>) {
  return `${formatMoneyAmount(money)} ${money.currencyCode === 'EUR' ? 'EURO' : money.currencyCode}`;
}
