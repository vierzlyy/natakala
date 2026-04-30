export const summarizeSizeQuantities = (sizeQuantities, fallback = 'Allsize') => {
  const summary = Object.entries(sizeQuantities || {})
    .filter(([, quantity]) => Number(quantity) > 0)
    .map(([size, quantity]) => `${size}: ${quantity}`)
    .join(', ');

  return summary || fallback || 'Allsize';
};

export const itemColor = (item) => item?.color || item?.product_color || '';

export const transactionItemSummary = (item) => {
  const label = [item?.sku, item?.product_name].filter(Boolean).join(' - ') || 'Produk';
  const sizeText = summarizeSizeQuantities(item?.size_quantities, item?.size || 'Allsize');
  const colorText = itemColor(item) || 'Tanpa warna';
  const quantity = Number(item?.quantity || 0);
  const conditionStatus = item?.condition_status || item?.condition || '';
  const conditionText = conditionStatus
    ? ` | Kondisi: ${conditionStatus}${item?.condition_note ? ` - ${item.condition_note}` : ''}`
    : '';

  return `${label} | Ukuran: ${sizeText} | Warna: ${colorText} | Qty: ${quantity} pcs${conditionText}`;
};

export const transactionItemSummaries = (items = []) => items.map((item) => transactionItemSummary(item));
