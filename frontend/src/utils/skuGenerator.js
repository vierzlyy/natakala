function sanitizeAlphaNumeric(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .trim();
}

export function buildNameCode(productName) {
  const words = sanitizeAlphaNumeric(productName).split(/\s+/).filter(Boolean);

  if (!words.length) {
    return 'PRD';
  }

  if (words.length === 1) {
    return words[0].slice(0, 3).padEnd(3, 'X');
  }

  const initials = words.slice(0, 3).map((word) => word[0]).join('');
  return initials.padEnd(3, 'X').slice(0, 3);
}

export function buildCategoryCode(categoryName) {
  const words = sanitizeAlphaNumeric(categoryName).split(/\s+/).filter(Boolean);

  if (!words.length) {
    return 'CT';
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).padEnd(2, 'X');
  }

  return `${words[0][0] || 'C'}${words[1][0] || 'T'}`;
}

export function buildSizeCode(size) {
  const normalized = sanitizeAlphaNumeric(size).replace(/\s+/g, '');
  return normalized.slice(0, 4) || 'GEN';
}

export function buildColorCode(color) {
  const normalized = sanitizeAlphaNumeric(color).replace(/\s+/g, '');
  return normalized.slice(0, 3) || 'CLR';
}

export function generateSku({ products = [], categories = [], productName, categoryId, size, color, currentProductId = null }) {
  const category = categories.find((item) => String(item.id) === String(categoryId));
  const nameCode = buildNameCode(productName);
  const categoryCode = buildCategoryCode(category?.name);
  const sizeCode = buildSizeCode(size);
  const colorCode = buildColorCode(color);
  const prefix = `NK-${nameCode}-${categoryCode}-${sizeCode}-${colorCode}`;

  const usedNumbers = products
    .filter((item) => String(item.id) !== String(currentProductId))
    .map((item) => String(item.sku || '').trim().toUpperCase())
    .filter((sku) => sku.startsWith(prefix))
    .map((sku) => Number(sku.split('-').pop()))
    .filter((value) => Number.isFinite(value));

  const nextNumber = (usedNumbers.length ? Math.max(...usedNumbers) : 0) + 1;
  return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
}

export default generateSku;
