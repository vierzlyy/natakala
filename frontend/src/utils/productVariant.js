const EMPTY_COLOR = '';
export const VARIANT_KEY_SEPARATOR = '|||';

export const variantKey = (color, size) => `${color || EMPTY_COLOR}${VARIANT_KEY_SEPARATOR}${size || 'Allsize'}`;

export const parseVariantKey = (key) => {
  const [color = EMPTY_COLOR, size = 'Allsize'] = String(key || '').split(VARIANT_KEY_SEPARATOR);
  return { color, size };
};

export const colorLabel = (color) => color || 'Tanpa warna';

export const normalizeColorList = (value) =>
  Array.from(
    new Set(
      String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

export const getProductVariantStocks = (product) => {
  if (!product) return [];

  const fallbackColors = normalizeColorList(product.color || '');
  const fallbackColor = fallbackColors.length === 1 ? fallbackColors[0] : EMPTY_COLOR;
  const fallbackSize = product.size === 'Allsize' || String(product.size_type || '').toLowerCase() === 'allsize'
    ? 'Allsize'
    : product.size || 'Allsize';

  if (Array.isArray(product.size_stocks) && product.size_stocks.length) {
    return product.size_stocks
      .filter((item) => item?.size)
      .map((item) => ({
        color: item.color || fallbackColor,
        size: item.size || fallbackSize,
        stock: Number(item.stock || 0),
      }));
  }

  if (product.stock_breakdown && typeof product.stock_breakdown === 'object') {
    const entries = Object.entries(product.stock_breakdown);
    const isNested = entries.some(([, value]) => value && typeof value === 'object' && !Array.isArray(value));

    if (isNested) {
      return entries.flatMap(([color, sizes]) =>
        Object.entries(sizes || {})
          .filter(([size]) => size)
          .map(([size, stock]) => ({
            color: color || fallbackColor,
            size,
            stock: Number(stock || 0),
          })),
      );
    }

    return entries
      .filter(([size]) => size)
      .map(([size, stock]) => ({
        color: fallbackColor,
        size,
        stock: Number(stock || 0),
      }));
  }

  return [
    {
      color: fallbackColor,
      size: fallbackSize,
      stock: Number(product.stock || 0),
    },
  ];
};

export const getProductVariantColors = (product) => {
  const colors = getProductVariantStocks(product).map((item) => item.color).filter(Boolean);
  if (colors.length) return Array.from(new Set(colors));
  return normalizeColorList(product?.color || '');
};

export const groupVariantStocksByColor = (product) => {
  const grouped = {};
  getProductVariantStocks(product).forEach((item) => {
    const color = item.color || EMPTY_COLOR;
    grouped[color] = grouped[color] || [];
    grouped[color].push(item);
  });

  return grouped;
};

export const getVariantAvailableStock = (product, color, size) => {
  const variant = getProductVariantStocks(product).find(
    (item) => String(item.color || EMPTY_COLOR) === String(color || EMPTY_COLOR) && String(item.size) === String(size),
  );

  return Number(variant?.stock || 0);
};

export const stockBreakdownFromVariants = (variants) =>
  variants.reduce((breakdown, variant) => {
    const color = variant.color || EMPTY_COLOR;
    breakdown[color] = breakdown[color] || {};
    breakdown[color][variant.size || 'Allsize'] = Number(variant.stock || 0);
    return breakdown;
  }, {});

export const formatVariantStockSummary = (product) => {
  if (!product) return '-';

  const sizeType = String(product.size_type || product.size || '').toLowerCase();
  const variants = getProductVariantStocks(product).filter((item) => item.size);

  if (!variants.length && (sizeType === 'allsize' || product.size === 'Allsize')) {
    return 'Allsize';
  }

  const grouped = variants.reduce((accumulator, variant) => {
    const color = variant.color || EMPTY_COLOR;
    accumulator[color] = accumulator[color] || [];
    accumulator[color].push(`${variant.size}: ${Number(variant.stock || 0)}`);
    return accumulator;
  }, {});

  const summary = Object.entries(grouped)
    .map(([color, sizes]) => `${colorLabel(color)} (${sizes.join(', ')})`)
    .join('; ');

  return summary || product.size || '-';
};

export const formatSizeStockSummary = (product) => {
  if (!product) return '-';

  const sizeType = String(product.size_type || product.size || '').toLowerCase();
  const variants = getProductVariantStocks(product).filter((item) => item.size);

  if (!variants.length && (sizeType === 'allsize' || product.size === 'Allsize')) {
    return 'Allsize';
  }

  const groupedBySize = variants.reduce((summary, variant) => {
    const size = variant.size || 'Allsize';
    summary[size] = Number(summary[size] || 0) + Number(variant.stock || 0);
    return summary;
  }, {});

  const summary = Object.entries(groupedBySize)
    .map(([size, stock]) => `${size}: ${stock}`)
    .join(', ');

  return summary || product.size || '-';
};

export const formatProductColor = (product) => {
  const colors = getProductVariantColors(product);
  return colors.length ? colors.map(colorLabel).join(', ') : product?.color || 'Tanpa warna';
};
