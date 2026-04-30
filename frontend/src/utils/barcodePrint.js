import { formatProductColor, formatSizeStockSummary } from './productVariant';

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

export default function printBarcodeLabel(product) {
  const printWindow = window.open('', '_blank', 'width=980,height=900');
  if (!printWindow) {
    throw new Error('POPUP_BLOCKED');
  }

  const title = `${product?.sku || 'barcode'}-${product?.name || 'produk'}`;
  const barcode = product?.barcode || product?.sku || '';
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
        ${buildCode128Svg(barcode)}
        <div class="code">${escapeHtml(barcode || '-')}</div>
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
