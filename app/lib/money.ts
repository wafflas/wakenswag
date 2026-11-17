type DisplayMoney = {amount: string; currencyCode: string};

/** Display Shopify amounts; calculations and totals remain on Shopify. */
export function formatMoneyAmount({amount, currencyCode}: DisplayMoney) {
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

export function formatMoney(money: DisplayMoney) {
  return `${formatMoneyAmount(money)} ${money.currencyCode === 'EUR' ? 'EURO' : money.currencyCode}`;
}
