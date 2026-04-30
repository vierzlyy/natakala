import { buildNameCode } from './skuGenerator';

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function textToDigits(value) {
  return String(value || '')
    .toUpperCase()
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);

      if (code >= 48 && code <= 57) {
        return char;
      }

      if (code >= 65 && code <= 90) {
        return String(code - 55).padStart(2, '0');
      }

      return '';
    })
    .join('');
}

export default function generateBarcode({
  products = [],
  productName,
  currentProductId = null,
}) {
  const identitySeed = buildNameCode(productName);
  const seedDigits = digitsOnly(textToDigits(identitySeed)).slice(0, 8).padEnd(8, '0');
  const prefix = `899${seedDigits}`;

  const usedNumbers = products
    .filter((item) => String(item.id) !== String(currentProductId))
    .map((item) => digitsOnly(item.barcode))
    .filter((barcode) => barcode.startsWith(prefix))
    .map((barcode) => Number(barcode.slice(prefix.length)))
    .filter((value) => Number.isFinite(value));

  const nextNumber = String((usedNumbers.length ? Math.max(...usedNumbers) : 0) + 1).padStart(2, '0');
  return `${prefix}${nextNumber}`;
}
