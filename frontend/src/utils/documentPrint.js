import formatCurrency from './formatCurrency';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function documentTypeLabel(type) {
  if (type === 'SURAT_JALAN') return 'Surat Jalan';
  if (type === 'FAKTUR') return 'Faktur Pembelian';
  return 'Nota Intern / GRN';
}

function buildRows(items = [], documentType) {
  if (!items.length) {
    return '<tr><td colspan="8">Tidak ada item dokumen.</td></tr>';
  }

  return items
    .map((item, index) => {
      const sizeText = item.size_quantities
        ? Object.entries(item.size_quantities)
            .filter(([, quantity]) => Number(quantity) > 0)
            .map(([size, quantity]) => `${size}: ${quantity}`)
            .join(', ')
        : item.size || 'Allsize';
      const subtotal = Number(item.quantity || 0) * Number(item.purchase_price || 0);
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.sku || '-')}</td>
          <td>${escapeHtml(item.product_name || '-')}</td>
          <td>${escapeHtml(sizeText)}</td>
          <td>${escapeHtml(item.color || item.product_color || '-')}</td>
          <td>${escapeHtml(item.quantity || 0)}</td>
          <td>${escapeHtml(formatCurrency(item.purchase_price || 0))}</td>
          <td>${escapeHtml(formatCurrency(subtotal))}</td>
        </tr>
      `;
    })
    .join('');
}

function documentAmount(document = {}) {
  const amount = Number(document.total_amount || 0);
  if (amount > 0) return amount;

  return (document.items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.purchase_price || 0),
    0,
  );
}

export default function printDigitalDocument(document) {
  const printWindow = window.open('', '_blank', 'width=1080,height=900');
  if (!printWindow) {
    throw new Error('POPUP_BLOCKED');
  }

  const typeLabel = documentTypeLabel(document.document_type);

  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(document.document_no || typeLabel)}</title>
        <style>
          body {
            margin: 0;
            padding: 28px;
            background: #f8f6f2;
            color: #1e1e1e;
            font-family: "Segoe UI", Arial, sans-serif;
          }
          .sheet {
            max-width: 1080px;
            margin: 0 auto;
            background: white;
            border: 1px solid #d6d3ce;
            border-radius: 22px;
            padding: 30px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            border-bottom: 2px solid #1e1e1e;
            padding-bottom: 18px;
          }
          .brand {
            font-size: 13px;
            font-weight: 800;
            letter-spacing: .18em;
            text-transform: uppercase;
          }
          h1 {
            margin: 8px 0 0;
            font-size: 30px;
          }
          .doc-no {
            border: 1px solid #d6d3ce;
            border-radius: 14px;
            padding: 12px 14px;
            min-width: 260px;
          }
          .label {
            color: #6b6b6b;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .value {
            margin-top: 6px;
            font-weight: 800;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            margin-top: 22px;
          }
          .box {
            border: 1px solid #d6d3ce;
            border-radius: 14px;
            padding: 13px 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 24px;
            border: 1px solid #d6d3ce;
          }
          th, td {
            border-bottom: 1px solid #edeae5;
            padding: 10px;
            text-align: left;
            font-size: 12px;
            vertical-align: top;
          }
          th {
            background: #edeae5;
            color: #1e1e1e;
            text-transform: uppercase;
            letter-spacing: .06em;
          }
          .total {
            display: flex;
            justify-content: flex-end;
            margin-top: 18px;
          }
          .total-box {
            width: 320px;
            border: 1px solid #1e1e1e;
            border-radius: 14px;
            padding: 14px;
          }
          .signatures {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 18px;
            margin-top: 34px;
          }
          .signature {
            text-align: center;
            border-top: 1px solid #d6d3ce;
            padding-top: 12px;
            margin-top: 72px;
            font-size: 12px;
            font-weight: 700;
          }
          @media print {
            body { background: white; padding: 0; }
            .sheet { border: 0; border-radius: 0; max-width: none; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div>
              <div class="brand">NataKala E-Inventory</div>
              <h1>${escapeHtml(typeLabel)}</h1>
              <p>${escapeHtml(document.notes || 'Dokumen digital inventaris gudang pakaian.')}</p>
            </div>
            <div class="doc-no">
              <div class="label">Nomor Dokumen</div>
              <div class="value">${escapeHtml(document.document_no || '-')}</div>
              <div class="label" style="margin-top:12px">Status</div>
              <div class="value">${escapeHtml(document.status || '-')}</div>
            </div>
          </div>

          <div class="grid">
            <div class="box"><div class="label">Supplier</div><div class="value">${escapeHtml(document.supplier_name || '-')}</div></div>
            <div class="box"><div class="label">Tanggal</div><div class="value">${escapeHtml(document.date || '-')}</div></div>
            <div class="box"><div class="label">Transaksi Masuk</div><div class="value">${escapeHtml(document.transaction_no || '-')}</div></div>
            <div class="box"><div class="label">Referensi</div><div class="value">${escapeHtml(document.reference_no || '-')}</div></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>SKU</th>
                <th>Produk</th>
                <th>Ukuran</th>
                <th>Warna</th>
                <th>Qty</th>
                <th>Harga Beli</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>${buildRows(document.items || [], document.document_type)}</tbody>
          </table>

          <div class="total">
            <div class="total-box">
              <div class="label">Ringkasan</div>
              <div class="value">Total item: ${escapeHtml(document.total_items || 0)} pcs</div>
              <div class="value">Nilai: ${escapeHtml(formatCurrency(documentAmount(document)))}</div>
            </div>
          </div>

          <div class="signatures">
            <div class="signature">Supplier</div>
            <div class="signature">Petugas Gudang</div>
            <div class="signature">Admin NataKala</div>
          </div>
        </div>
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
