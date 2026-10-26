import type {ProductFragment} from 'storefrontapi.generated';

export interface ProductDetailTheme {
  key: string;
  anchor: readonly [number, number, number];
  aliases: readonly string[];
  gradient: string;
}

const PRODUCT_THEMES: readonly ProductDetailTheme[] = [
  {
    key: 'red',
    anchor: [190, 30, 45],
    aliases: ['red', 'burgundy', 'maroon', 'crimson'],
    gradient: 'linear-gradient(145deg, #760c18 0%, #57030c 48%, #280006 100%)',
  },
  {
    key: 'blue',
    anchor: [35, 95, 190],
    aliases: ['blue', 'navy', 'cobalt', 'royal blue'],
    gradient: 'linear-gradient(145deg, #193f7a 0%, #0d2857 48%, #061329 100%)',
  },
  {
    key: 'green',
    anchor: [42, 130, 75],
    aliases: ['green', 'olive', 'forest', 'lime'],
    gradient: 'linear-gradient(145deg, #245f3a 0%, #123d27 48%, #071b10 100%)',
  },
  {
    key: 'yellow',
    anchor: [220, 190, 55],
    aliases: ['yellow', 'gold', 'mustard'],
    gradient: 'linear-gradient(145deg, #82701c 0%, #56470a 48%, #211b02 100%)',
  },
  {
    key: 'orange',
    anchor: [225, 110, 35],
    aliases: ['orange', 'rust', 'terracotta'],
    gradient: 'linear-gradient(145deg, #91421a 0%, #63270c 48%, #2a0e03 100%)',
  },
  {
    key: 'purple',
    anchor: [120, 65, 165],
    aliases: ['purple', 'violet', 'lavender'],
    gradient: 'linear-gradient(145deg, #593278 0%, #351b52 48%, #180922 100%)',
  },
  {
    key: 'pink',
    anchor: [215, 95, 145],
    aliases: ['pink', 'rose', 'magenta'],
    gradient: 'linear-gradient(145deg, #8c365c 0%, #5e1d3c 48%, #28091a 100%)',
  },
  {
    key: 'brown',
    anchor: [115, 75, 50],
    aliases: ['brown', 'tan', 'coffee', 'chocolate'],
    gradient: 'linear-gradient(145deg, #5f402e 0%, #382318 48%, #180d08 100%)',
  },
  {
    key: 'white',
    anchor: [235, 235, 230],
    aliases: ['white', 'cream', 'ivory', 'natural'],
    gradient: 'linear-gradient(145deg, #888884 0%, #575754 48%, #282827 100%)',
  },
  {
    key: 'black',
    anchor: [25, 25, 25],
    aliases: ['black', 'charcoal'],
    gradient: 'linear-gradient(145deg, #383838 0%, #181818 48%, #050505 100%)',
  },
  {
    key: 'gray',
    anchor: [125, 125, 125],
    aliases: ['gray', 'grey', 'silver'],
    gradient: 'linear-gradient(145deg, #646464 0%, #383838 48%, #151515 100%)',
  },
];

const DEFAULT_THEME =
  PRODUCT_THEMES.find((theme) => theme.key === 'gray') ?? PRODUCT_THEMES[0];

type SelectedVariant = ProductFragment['selectedOrFirstAvailableVariant'];

export function getProductDetailTheme(
  product: Pick<ProductFragment, 'title' | 'options'>,
  selectedVariant: SelectedVariant,
): ProductDetailTheme {
  const selectedColor = selectedVariant?.selectedOptions.find((option) =>
    /^colou?r$/i.test(option.name),
  );

  const colorOption = product.options.find((option) =>
    /^colou?r$/i.test(option.name),
  );

  const selectedOptionValue = colorOption?.optionValues.find(
    (value) =>
      normalizeColorName(value.name) ===
      normalizeColorName(selectedColor?.value ?? ''),
  );

  const candidates = [
    selectedColor?.value,
    selectedOptionValue?.swatch?.color,
    product.title,
  ];

  for (const candidate of candidates) {
    const theme = findTheme(candidate);

    if (theme) return theme;
  }

  return DEFAULT_THEME;
}

function findTheme(input?: string | null): ProductDetailTheme | undefined {
  if (!input) return undefined;

  const hexColor = parseHexColor(input);

  if (hexColor) {
    return findClosestTheme(hexColor);
  }

  const normalized = ` ${normalizeColorName(input)} `;

  return PRODUCT_THEMES.find((theme) =>
    theme.aliases.some((alias) =>
      normalized.includes(` ${normalizeColorName(alias)} `),
    ),
  );
}

function normalizeColorName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseHexColor(
  value: string,
): readonly [number, number, number] | undefined {
  const match = value.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i);

  if (!match) return undefined;

  const hex =
    match[1].length === 3
      ? match[1]
          .split('')
          .map((character) => character + character)
          .join('')
      : match[1];

  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

function findClosestTheme(
  color: readonly [number, number, number],
): ProductDetailTheme {
  return PRODUCT_THEMES.reduce((closest, theme) => {
    const currentDistance = colorDistance(color, closest.anchor);

    const nextDistance = colorDistance(color, theme.anchor);

    return nextDistance < currentDistance ? theme : closest;
  }, DEFAULT_THEME);
}

function colorDistance(
  first: readonly [number, number, number],
  second: readonly [number, number, number],
) {
  return (
    (first[0] - second[0]) ** 2 +
    (first[1] - second[1]) ** 2 +
    (first[2] - second[2]) ** 2
  );
}
