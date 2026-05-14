import formatCurrency from './formatCurrency';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function documentTypeLabel(type) {
  if (type === 'SURAT_JALAN') return 'Surat Jalan Supplier';
  if (type === 'FAKTUR') return 'Faktur Pembelian';
  return 'Nota Intern / Goods Receipt Note';
}

function documentTypeCode(type) {
  if (type === 'SURAT_JALAN') return 'SJ';
  if (type === 'FAKTUR') return 'INV';
  return 'GRN';
}

function documentTypeDescription(type) {
  if (type === 'SURAT_JALAN') return 'Dokumen pengantar dan bukti penerimaan barang dari supplier.';
  if (type === 'FAKTUR') return 'Dokumen pembelian berdasarkan barang yang telah diterima dan dicatat.';
  return 'Dokumen penerimaan barang, pemeriksaan QC, dan pencatatan stok masuk.';
}

function printDateText() {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

function tableColspan(documentType) {
  if (documentType === 'SURAT_JALAN') return 7;
  return 8;
}

function buildTableHead(documentType) {
  if (documentType === 'SURAT_JALAN') {
    return `
      <tr>
        <th class="col-no">No</th>
        <th>SKU</th>
        <th>Produk</th>
        <th>Ukuran</th>
        <th>Warna</th>
        <th class="col-qty">Qty</th>
        <th>Keterangan</th>
      </tr>
    `;
  }

  if (documentType === 'GRN') {
    return `
      <tr>
        <th class="col-no">No</th>
        <th>SKU</th>
        <th>Produk</th>
        <th class="col-qty">Qty Masuk</th>
        <th class="col-qty">Diterima</th>
        <th class="col-qty">Ditolak</th>
        <th>Status QC</th>
        <th>Catatan</th>
      </tr>
    `;
  }

  return `
    <tr>
      <th class="col-no">No</th>
      <th>SKU</th>
      <th>Produk</th>
      <th>Ukuran</th>
      <th>Warna</th>
      <th class="col-qty">Qty</th>
      <th class="col-price">Harga Beli</th>
      <th class="col-subtotal">Subtotal</th>
    </tr>
  `;
}

function buildRows(items = [], documentType) {
  if (!items.length) {
    return `<tr><td colspan="${tableColspan(documentType)}">Tidak ada item dokumen.</td></tr>`;
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

      if (documentType === 'SURAT_JALAN') {
        return `
          <tr>
            <td class="col-no">${index + 1}</td>
            <td class="muted-cell">${escapeHtml(item.sku || '-')}</td>
            <td class="product-cell">${escapeHtml(item.product_name || '-')}</td>
            <td>${escapeHtml(sizeText)}</td>
            <td>${escapeHtml(item.color || item.product_color || '-')}</td>
            <td class="col-qty">${escapeHtml(item.quantity || 0)}</td>
            <td>${escapeHtml(item.qc_status || 'Diterima')}</td>
          </tr>
        `;
      }

      if (documentType === 'GRN') {
        return `
          <tr>
            <td class="col-no">${index + 1}</td>
            <td class="muted-cell">${escapeHtml(item.sku || '-')}</td>
            <td class="product-cell">${escapeHtml(item.product_name || '-')}</td>
            <td class="col-qty">${escapeHtml(item.quantity || 0)}</td>
            <td class="col-qty">${escapeHtml(item.accepted_quantity ?? item.quantity ?? 0)}</td>
            <td class="col-qty">${escapeHtml(item.rejected_quantity || 0)}</td>
            <td>${escapeHtml(item.qc_status || 'Lulus QC')}</td>
            <td>${escapeHtml(item.qc_note || '-')}</td>
          </tr>
        `;
      }

      return `
        <tr>
          <td class="col-no">${index + 1}</td>
          <td class="muted-cell">${escapeHtml(item.sku || '-')}</td>
          <td class="product-cell">${escapeHtml(item.product_name || '-')}</td>
          <td>${escapeHtml(sizeText)}</td>
          <td>${escapeHtml(item.color || item.product_color || '-')}</td>
          <td class="col-qty">${escapeHtml(item.quantity || 0)}</td>
          <td class="col-price">${escapeHtml(formatCurrency(item.purchase_price || 0))}</td>
          <td class="col-subtotal">${escapeHtml(formatCurrency(subtotal))}</td>
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

function buildSummary(document = {}) {
  const type = document.document_type;

  if (type === 'SURAT_JALAN') {
    return `
      <div class="summary-row">
        <span>Total barang</span>
        <span class="summary-value">${escapeHtml(document.total_items || 0)} pcs</span>
      </div>
      <div class="summary-row">
        <span>Status</span>
        <span class="summary-value">${escapeHtml(document.status || '-')}</span>
      </div>
    `;
  }

  if (type === 'GRN') {
    return `
      <div class="summary-row">
        <span>Total masuk</span>
        <span class="summary-value">${escapeHtml(document.total_items || 0)} pcs</span>
      </div>
      <div class="summary-row">
        <span>Diterima</span>
        <span class="summary-value">${escapeHtml(document.accepted_items ?? document.total_items ?? 0)} pcs</span>
      </div>
      <div class="summary-row">
        <span>Ditolak</span>
        <span class="summary-value">${escapeHtml(document.rejected_items || 0)} pcs</span>
      </div>
    `;
  }

  return `
    <div class="summary-row">
      <span>Total item</span>
      <span class="summary-value">${escapeHtml(document.total_items || 0)} pcs</span>
    </div>
    <div class="summary-row">
      <span>Nilai</span>
      <span class="summary-value">${escapeHtml(formatCurrency(documentAmount(document)))}</span>
    </div>
  `;
}

export default function printDigitalDocument(document) {
  const printWindow = window.open('', '_blank', 'width=1080,height=900');
  if (!printWindow) {
    throw new Error('POPUP_BLOCKED');
  }

  const typeLabel = documentTypeLabel(document.document_type);
  const typeCode = documentTypeCode(document.document_type);
  const typeDescription = document.notes || documentTypeDescription(document.document_type);
  const generatedAt = printDateText();

  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(document.document_no || typeLabel)}</title>
        <style>
          :root {
            --ink: #111827;
            --muted: #5f6673;
            --line: #cfd4dc;
            --soft-line: #e5e7eb;
            --paper: #ffffff;
            --surface: #f3f4f6;
            --strong-surface: #e7eaf0;
            --brand: #9a6a38;
            --brand-soft: #f8f1e8;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 20px;
            background: #f1f3f6;
            color: var(--ink);
            font-family: Arial, "Segoe UI", sans-serif;
            font-size: 13px;
            line-height: 1.42;
          }
          .sheet {
            max-width: 920px;
            min-height: 1290px;
            margin: 0 auto;
            background: var(--paper);
            border: 1px solid #b9c0cc;
            padding: 0;
            box-shadow: 0 14px 40px rgba(17, 24, 39, .10);
          }
          .brand-strip {
            height: 7px;
            background: linear-gradient(90deg, var(--ink) 0 34%, var(--brand) 34% 100%);
          }
          .content {
            padding: 30px 36px 28px;
          }
          .header {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 285px;
            gap: 24px;
            align-items: start;
            border-bottom: 3px solid var(--ink);
            padding-bottom: 16px;
          }
          .masthead {
            display: flex;
            align-items: flex-start;
            gap: 14px;
          }
          .monogram {
            display: flex;
            width: 46px;
            height: 46px;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            border: 2px solid var(--ink);
            background: var(--brand-soft);
            color: var(--ink);
            font-size: 17px;
            font-weight: 900;
            letter-spacing: .03em;
          }
          .brand {
            font-size: 12px;
            font-weight: 800;
            letter-spacing: .16em;
            text-transform: uppercase;
          }
          .brand-meta {
            margin-top: 3px;
            color: var(--muted);
            font-size: 11px;
            letter-spacing: .03em;
            text-transform: uppercase;
          }
          h1 {
            margin: 18px 0 7px;
            font-size: 28px;
            line-height: 1.12;
            letter-spacing: .02em;
            text-transform: uppercase;
          }
          .doc-code {
            display: inline-flex;
            margin-top: 8px;
            border: 1px solid var(--brand);
            background: var(--brand-soft);
            padding: 5px 9px;
            color: #5d3d1e;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .12em;
            text-transform: uppercase;
          }
          p {
            max-width: 520px;
            margin: 0;
            color: var(--muted);
            font-size: 12px;
          }
          .doc-no {
            overflow: hidden;
            border: 1px solid var(--line);
            background: #fff;
          }
          .doc-no-title {
            background: var(--ink);
            color: #fff;
            padding: 8px 12px;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: .1em;
            text-transform: uppercase;
          }
          .doc-row {
            display: grid;
            gap: 4px;
            padding: 10px 12px;
          }
          .doc-row + .doc-row {
            border-top: 1px solid var(--soft-line);
          }
          .label {
            color: var(--muted);
            font-size: 9px;
            font-weight: 700;
            letter-spacing: .08em;
            text-transform: uppercase;
          }
          .value {
            font-weight: 800;
            overflow-wrap: anywhere;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            border-top: 1px solid var(--line);
            border-left: 1px solid var(--line);
            margin-top: 20px;
          }
          .box {
            border-right: 1px solid var(--line);
            border-bottom: 1px solid var(--line);
            background: #fff;
            padding: 10px 12px;
          }
          .box .value {
            margin-top: 4px;
            font-size: 13px;
          }
          .table-wrap {
            overflow: hidden;
            margin-top: 22px;
            border: 1px solid var(--line);
            background: #fff;
          }
          .section-title {
            margin-top: 22px;
            color: var(--ink);
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .12em;
            text-transform: uppercase;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border-right: 1px solid var(--soft-line);
            border-bottom: 1px solid var(--soft-line);
            padding: 9px 8px;
            text-align: left;
            font-size: 11px;
            vertical-align: top;
          }
          th:last-child,
          td:last-child {
            border-right: 0;
          }
          th {
            background: var(--strong-surface);
            color: var(--ink);
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .08em;
          }
          tbody tr:last-child td {
            border-bottom: 0;
          }
          .col-no,
          .col-qty {
            width: 46px;
            text-align: center;
          }
          .col-price,
          .col-subtotal {
            text-align: right;
            white-space: nowrap;
          }
          .product-cell {
            min-width: 180px;
            font-weight: 700;
          }
          .muted-cell {
            color: var(--muted);
          }
          .total {
            display: flex;
            justify-content: flex-end;
            margin-top: 16px;
          }
          .total-box {
            width: 315px;
            border: 1px solid var(--ink);
            background: #fff;
            padding: 0;
          }
          .total-box .label {
            display: block;
            background: var(--strong-surface);
            border-bottom: 1px solid var(--ink);
            color: var(--ink);
            padding: 8px 10px;
          }
          .summary-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 9px 10px;
          }
          .summary-row + .summary-row {
            border-top: 1px solid var(--line);
          }
          .summary-value {
            font-size: 14px;
            font-weight: 900;
          }
          .signatures {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 28px;
            margin-top: 76px;
          }
          .signature {
            text-align: center;
            border-top: 1px solid var(--ink);
            padding-top: 9px;
            font-size: 12px;
            font-weight: 700;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-top: 32px;
            border-top: 1px solid var(--line);
            padding-top: 12px;
            color: var(--muted);
            font-size: 10px;
          }
          .footer strong {
            color: var(--ink);
            letter-spacing: .08em;
            text-transform: uppercase;
          }
          @media print {
            @page {
              size: A4;
              margin: 14mm;
            }
            body {
              background: white;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .sheet {
              min-height: auto;
              max-width: none;
              border: 0;
              box-shadow: none;
            }
            .content {
              padding: 0;
            }
            .brand-strip {
              height: 5px;
              margin-bottom: 18px;
            }
            th, td {
              padding: 8px 7px;
            }
          }
          @media (max-width: 720px) {
            body {
              padding: 12px;
            }
            .sheet {
              min-height: auto;
            }
            .content {
              padding: 22px;
            }
            .header,
            .grid {
              grid-template-columns: 1fr;
            }
            h1 {
              font-size: 30px;
            }
            .table-wrap {
              overflow-x: auto;
            }
            table {
              min-width: 760px;
            }
            .total {
              justify-content: stretch;
            }
            .total-box {
              width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="brand-strip"></div>
          <div class="content">
          <div class="header">
            <div>
              <div class="masthead">
                <div class="monogram">NK</div>
                <div>
                  <div class="brand">NataKala E-Inventory</div>
                  <div class="brand-meta">Inventory Control Document</div>
                </div>
              </div>
              <h1>${escapeHtml(typeLabel)}</h1>
              <p>${escapeHtml(typeDescription)}</p>
              <div class="doc-code">${escapeHtml(typeCode)}</div>
            </div>
            <div class="doc-no">
              <div class="doc-no-title">Identitas Dokumen</div>
              <div class="doc-row">
                <div class="label">Nomor Dokumen</div>
                <div class="value">${escapeHtml(document.document_no || '-')}</div>
              </div>
              <div class="doc-row">
                <div class="label">Status</div>
                <div class="value">${escapeHtml(document.status || '-')}</div>
              </div>
              <div class="doc-row">
                <div class="label">Dicetak</div>
                <div class="value">${escapeHtml(generatedAt)}</div>
              </div>
            </div>
          </div>

          <div class="grid">
            <div class="box"><div class="label">Supplier</div><div class="value">${escapeHtml(document.supplier_name || '-')}</div></div>
            <div class="box"><div class="label">Tanggal</div><div class="value">${escapeHtml(document.date || '-')}</div></div>
            <div class="box"><div class="label">Transaksi Masuk</div><div class="value">${escapeHtml(document.transaction_no || '-')}</div></div>
            <div class="box"><div class="label">Referensi</div><div class="value">${escapeHtml(document.reference_no || '-')}</div></div>
          </div>

          <div class="section-title">Rincian Barang</div>
          <div class="table-wrap">
            <table>
              <thead>
                ${buildTableHead(document.document_type)}
              </thead>
              <tbody>${buildRows(document.items || [], document.document_type)}</tbody>
            </table>
          </div>

          <div class="total">
            <div class="total-box">
              <div class="label">Ringkasan</div>
              ${buildSummary(document)}
            </div>
          </div>

          <div class="signatures">
            <div class="signature">Supplier</div>
            <div class="signature">Petugas Gudang</div>
            <div class="signature">Admin NataKala</div>
          </div>

          <div class="footer">
            <span><strong>NataKala</strong> E-Inventory</span>
            <span>Dokumen ini dibuat otomatis oleh sistem dan sah sebagai arsip operasional internal.</span>
          </div>
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
