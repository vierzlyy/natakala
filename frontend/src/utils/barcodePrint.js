import QRCode from 'qrcode';
import { formatProductColor, formatSizeStockSummary } from './productVariant';
import { toEan13 } from './barcodeGenerator';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];

function canUseCode128C(value) {
  return /^\d{2,}$/.test(value) && value.length % 2 === 0;
}

function encodeCode128(value) {
  const text = String(value || '').trim() || '-';
  const useCodeC = canUseCode128C(text);
  const codes = useCodeC ? [105] : [104];

  if (useCodeC) {
    for (let index = 0; index < text.length; index += 2) {
      codes.push(Number(text.slice(index, index + 2)));
    }
  } else {
    for (const char of text) {
      const code = char.charCodeAt(0);
      codes.push(code >= 32 && code <= 126 ? code - 32 : 13);
    }
  }

  const checksum = codes.reduce((total, code, index) => total + code * (index || 1), 0) % 103;
  return [...codes, checksum, 106];
}

function buildCode128Svg(value) {
  const codes = encodeCode128(value);
  const moduleWidth = 2;
  const height = 92;
  let x = 20;
  const rects = [];

  codes.forEach((code) => {
    const pattern = CODE128_PATTERNS[code];
    [...pattern].forEach((width, index) => {
      const barWidth = Number(width) * moduleWidth;
      if (index % 2 === 0) {
        rects.push(`<rect x="${x}" y="0" width="${barWidth}" height="${height}" />`);
      }
      x += barWidth;
    });
  });

  return `
    <svg class="barcode" viewBox="0 0 ${x + 20} ${height}" role="img" aria-label="Barcode ${escapeHtml(value || '-')}">
      <rect width="100%" height="100%" fill="#fff" />
      <g fill="#111">${rects.join('')}</g>
    </svg>
  `;
}

const EAN_LEFT_ODD = {
  0: '0001101',
  1: '0011001',
  2: '0010011',
  3: '0111101',
  4: '0100011',
  5: '0110001',
  6: '0101111',
  7: '0111011',
  8: '0110111',
  9: '0001011',
};

const EAN_LEFT_EVEN = {
  0: '0100111',
  1: '0110011',
  2: '0011011',
  3: '0100001',
  4: '0011101',
  5: '0111001',
  6: '0000101',
  7: '0010001',
  8: '0001001',
  9: '0010111',
};

const EAN_RIGHT = {
  0: '1110010',
  1: '1100110',
  2: '1101100',
  3: '1000010',
  4: '1011100',
  5: '1001110',
  6: '1010000',
  7: '1000100',
  8: '1001000',
  9: '1110100',
};

const EAN_PARITY = {
  0: 'OOOOOO',
  1: 'OOEOEE',
  2: 'OOEEOE',
  3: 'OOEEEO',
  4: 'OEOOEE',
  5: 'OEEOOE',
  6: 'OEEEOO',
  7: 'OEOEOE',
  8: 'OEOEEO',
  9: 'OEEOEO',
};

function buildBarsFromBits(bits, moduleWidth = 2) {
  let x = 0;
  const rects = [];

  [...bits].forEach((bit) => {
    if (bit === '1') {
      rects.push(`<rect x="${x}" y="0" width="${moduleWidth}" height="100" />`);
    }
    x += moduleWidth;
  });

  return { width: x, rects };
}

function buildEan13Svg(value) {
  const digits = toEan13(value);
  const firstDigit = Number(digits[0]);
  const parity = EAN_PARITY[firstDigit] || EAN_PARITY[0];
  const left = digits
    .slice(1, 7)
    .split('')
    .map((digit, index) => (parity[index] === 'E' ? EAN_LEFT_EVEN[digit] : EAN_LEFT_ODD[digit]))
    .join('');
  const right = digits
    .slice(7)
    .split('')
    .map((digit) => EAN_RIGHT[digit])
    .join('');
  const { width, rects } = buildBarsFromBits(`101${left}01010${right}101`, 2);

  return `
    <svg class="barcode" viewBox="0 0 ${width} 100" role="img" aria-label="EAN13 ${escapeHtml(digits)}">
      <rect width="100%" height="100%" fill="#fff" />
      <g fill="#111">${rects.join('')}</g>
    </svg>
  `;
}

function buildQrSvg(value) {
  const qr = QRCode.create(String(value || '-'), {
    errorCorrectionLevel: 'M',
    margin: 0,
  });
  const size = qr.modules.size;
  const cells = [];

  qr.modules.data.forEach((enabled, index) => {
    if (!enabled) return;
    const x = index % size;
    const y = Math.floor(index / size);
    cells.push(`<rect x="${x}" y="${y}" width="1" height="1" />`);
  });

  return `
    <svg class="barcode qr-code" viewBox="0 0 ${size} ${size}" role="img" aria-label="QR Code ${escapeHtml(value || '-')}">
      <rect width="100%" height="100%" fill="#fff" />
      <g fill="#111">${cells.join('')}</g>
    </svg>
  `;
}

function resolveBarcodeMarkup(value, format) {
  const normalizedFormat = String(format || 'CODE128').toUpperCase();

  if (normalizedFormat === 'EAN13') {
    return {
      displayValue: toEan13(value),
      markup: buildEan13Svg(value),
    };
  }

  if (normalizedFormat === 'QR') {
    return {
      displayValue: String(value || '-'),
      markup: buildQrSvg(value),
    };
  }

  return {
    displayValue: String(value || '-'),
    markup: buildCode128Svg(value),
  };
}

export default function printBarcodeLabel(product, options = {}) {
  const printWindow = window.open('', '_blank', 'width=980,height=900');
  if (!printWindow) {
    throw new Error('POPUP_BLOCKED');
  }

  const title = `${product?.sku || 'barcode'}-${product?.name || 'produk'}`;
  const barcode = product?.barcode || product?.sku || '';
  const barcodeResult = resolveBarcodeMarkup(barcode, options.format);
  const location = product?.storage_location || [product?.storage_zone, product?.storage_aisle, product?.storage_rack, product?.storage_bin]
    .filter(Boolean)
    .join(' / ');
  const labelMarkup = Array.from({ length: 20 }, (_, index) => `
    <div class="label">
      <div class="label-head">
        <div>
          <div class="brand">NataKala Inventory</div>
          <div class="name">${escapeHtml(product?.name || '-')}</div>
        </div>
      </div>
      <div class="meta">${escapeHtml(product?.sku || '-')} | ${escapeHtml(formatProductColor(product))} | ${escapeHtml(formatSizeStockSummary(product))}</div>
      <div class="barcode-wrap">
        ${barcodeResult.markup}
        <div class="code">${escapeHtml(barcodeResult.displayValue)}</div>
      </div>
      <div class="location">Lokasi: ${escapeHtml(location || '-')}</div>
    </div>
  `).join('');

  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 24px;
            background: #f3f0ea;
            color: #171717;
            font-family: "Segoe UI", Arial, sans-serif;
          }
          .sheet {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            width: min(100%, 1120px);
            margin: 0 auto;
            padding: 14px;
            border-radius: 12px;
            background: #fff;
            box-shadow: 0 18px 45px rgba(31, 28, 23, 0.13);
          }
          .label {
            display: flex;
            min-height: 168px;
            flex-direction: column;
            border: 1px solid #d8d2c8;
            border-radius: 7px;
            background: #fff;
            padding: 10px;
            overflow: hidden;
            page-break-inside: avoid;
          }
          .label-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 8px;
          }
          .brand {
            font-size: 7.5px;
            font-weight: 800;
            letter-spacing: 0.14em;
            line-height: 1.2;
            text-transform: uppercase;
          }
          .name {
            display: -webkit-box;
            margin-top: 4px;
            overflow: hidden;
            font-size: 12.5px;
            font-weight: 800;
            line-height: 1.2;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
          }
          .meta {
            margin-top: 4px;
            color: #555;
            font-size: 8.5px;
            font-weight: 600;
            line-height: 1.25;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .barcode-wrap {
            display: flex;
            flex: 1;
            flex-direction: column;
            justify-content: center;
            margin-top: 8px;
            border: 1px solid #eee8df;
            border-radius: 5px;
            background: #fff;
            padding: 7px 8px 5px;
          }
          .barcode {
            display: block;
            width: 100%;
            height: 58px;
            shape-rendering: crispEdges;
          }
          .qr-code {
            height: 68px;
            margin: 0 auto;
            width: 68px;
          }
          .code {
            margin-top: 5px;
            font-family: "Consolas", "Courier New", monospace;
            font-size: 11.5px;
            font-weight: 800;
            letter-spacing: 0.08em;
            line-height: 1;
            text-align: center;
          }
          .location {
            margin-top: 7px;
            border-top: 1px dashed #bbb;
            padding-top: 5px;
            font-size: 8.5px;
            line-height: 1.2;
            color: #333;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          @media print {
            @page { size: A4; margin: 7mm; }
            body { background: #fff; padding: 0; }
            .sheet {
              grid-template-columns: repeat(4, 1fr);
              gap: 2.6mm;
              width: 100%;
              padding: 0;
              border-radius: 0;
              box-shadow: none;
              max-width: none;
            }
            .label {
              height: 53mm;
              min-height: 0;
              border-color: #bbb;
              border-radius: 1.8mm;
              box-shadow: none;
            }
            .barcode { height: 21mm; }
            .qr-code {
              height: 23mm;
              width: 23mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet">${labelMarkup}</div>
        <script>
          window.onload = () => {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
