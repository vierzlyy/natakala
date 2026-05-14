function prettifyKey(key) {
  if (key === 'sku' || key === 'SKU') return 'SKU';
  return String(key || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatReportValue(key, value) {
  if (value === null || value === undefined || value === '') return '-';

  const normalizedKey = String(key || '').toLowerCase();
  const shouldFormatCurrency =
    normalizedKey.includes('price') ||
    normalizedKey.includes('amount') ||
    normalizedKey.includes('value');

  if (typeof value === 'number' && shouldFormatCurrency) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (typeof value === 'number') {
    return new Intl.NumberFormat('id-ID').format(value);
  }

  if (Array.isArray(value) || typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function buildSummaryRows(summary = {}) {
  return (
    Object.entries(summary)
      .map(
        ([key, value]) => `
          <div class="metric-card">
            <div class="metric-label">${escapeHtml(prettifyKey(key))}</div>
            <div class="metric-value">${escapeHtml(formatReportValue(key, value))}</div>
          </div>`,
      )
      .join('') ||
    '<div class="metric-card"><div class="metric-label">Ringkasan</div><div class="metric-value">-</div></div>'
  );
}

function buildTableHead(data = []) {
  if (!data.length) {
    return '<tr><th>Data</th></tr>';
  }

  return `<tr>${Object.keys(data[0])
    .map((key) => `<th>${escapeHtml(prettifyKey(key))}</th>`)
    .join('')}</tr>`;
}

function buildTableBody(data = []) {
  if (!data.length) {
    return '<tr><td>Tidak ada data laporan.</td></tr>';
  }

  const headers = Object.keys(data[0]);

  return data
    .map(
      (row) => `
        <tr>
          ${headers.map((key) => `<td>${escapeHtml(formatReportValue(key, row[key]))}</td>`).join('')}
        </tr>`,
    )
    .join('');
}

function buildReportHtml({ title, subtitle, summary, data }) {
  return `
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: Arial, "Segoe UI", Helvetica, sans-serif;
            background: #f1f3f6;
            color: #111827;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.45;
          }
          .sheet {
            max-width: 1120px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #c8ced8;
            box-shadow: 0 14px 40px rgba(17, 24, 39, 0.10);
          }
          .brand-strip {
            height: 7px;
            background: linear-gradient(90deg, #111827 0 34%, #9a6a38 34% 100%);
          }
          .content {
            padding: 28px 32px 26px;
          }
          .brand-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 260px;
            align-items: start;
            gap: 24px;
            padding-bottom: 18px;
            border-bottom: 3px solid #111827;
          }
          .masthead {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .monogram {
            display: flex;
            width: 44px;
            height: 44px;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            border: 2px solid #111827;
            background: #f8f1e8;
            color: #111827;
            font-size: 16px;
            font-weight: 900;
          }
          .brand-name {
            font-size: 12px;
            font-weight: 900;
            letter-spacing: .16em;
            text-transform: uppercase;
          }
          .brand-meta {
            margin-top: 3px;
            color: #5f6673;
            font-size: 10px;
            letter-spacing: .06em;
            text-transform: uppercase;
          }
          h1 {
            margin: 18px 0 8px;
            font-size: 27px;
            line-height: 1.12;
            color: #111827;
            text-transform: uppercase;
          }
          .subtitle {
            max-width: 680px;
            color: #5f6673;
            font-size: 12px;
          }
          .meta-box {
            border: 1px solid #cfd4dc;
            background: #fff;
          }
          .meta-title {
            background: #111827;
            color: #fff;
            padding: 8px 10px;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: .1em;
            text-transform: uppercase;
          }
          .meta-value {
            padding: 10px;
            font-size: 13px;
            font-weight: 800;
            color: #111827;
          }
          .section-title {
            margin-top: 22px;
            margin-bottom: 10px;
            font-size: 11px;
            font-weight: 900;
            color: #111827;
            letter-spacing: .12em;
            text-transform: uppercase;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            border-top: 1px solid #cfd4dc;
            border-left: 1px solid #cfd4dc;
          }
          .metric-card {
            border-right: 1px solid #cfd4dc;
            border-bottom: 1px solid #cfd4dc;
            padding: 12px 13px;
            background: #fff;
          }
          .metric-label {
            font-size: 9px;
            font-weight: 800;
            color: #5f6673;
            text-transform: uppercase;
            letter-spacing: .08em;
          }
          .metric-value {
            margin-top: 7px;
            font-size: 19px;
            font-weight: 900;
            color: #111827;
          }
          .table-wrap {
            overflow-x: auto;
          }
          .report-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #cfd4dc;
          }
          .report-table th {
            background: #e7eaf0;
            color: #111827;
            text-align: left;
            padding: 9px 8px;
            border: 1px solid #cfd4dc;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .08em;
          }
          .report-table td {
            padding: 8px;
            border: 1px solid #e5e7eb;
            font-size: 11px;
            vertical-align: top;
          }
          .signature-wrap {
            display: flex;
            justify-content: flex-end;
            margin-top: 34px;
          }
          .signature-box {
            width: 260px;
            text-align: left;
          }
          .signature-label {
            font-size: 12px;
            color: #5f6673;
          }
          .signature-space {
            height: 58px;
          }
          .signature-name {
            font-size: 14px;
            font-weight: 900;
            color: #111827;
            border-top: 1px solid #111827;
            padding-top: 8px;
          }
          .signature-role {
            margin-top: 4px;
            font-size: 12px;
            color: #5f6673;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            margin-top: 24px;
            color: #5f6673;
            font-size: 10px;
            padding-top: 12px;
            border-top: 1px solid #cfd4dc;
          }
          .footer strong {
            color: #111827;
            letter-spacing: .08em;
            text-transform: uppercase;
          }
          @media print {
            @page {
              size: A4 landscape;
              margin: 12mm;
            }
            body {
              background: white;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .sheet {
              border: 0;
              box-shadow: none;
              max-width: none;
            }
            .content {
              padding: 0;
            }
            .brand-strip {
              height: 5px;
              margin-bottom: 16px;
            }
          }
          @media (max-width: 760px) {
            body { padding: 12px; }
            .content { padding: 22px; }
            .brand-row,
            .summary-grid {
              grid-template-columns: 1fr;
            }
            .report-table {
              min-width: 820px;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="brand-strip"></div>
          <div class="content">
            <div class="brand-row">
              <div>
                <div class="masthead">
                  <div class="monogram">NK</div>
                  <div>
                    <div class="brand-name">NataKala E-Inventory</div>
                    <div class="brand-meta">Inventory Report Document</div>
                  </div>
                </div>
                <h1>${escapeHtml(title)}</h1>
                <div class="subtitle">${escapeHtml(subtitle)}</div>
              </div>
              <div class="meta-box">
                <div class="meta-title">Tanggal Export</div>
                <div class="meta-value">${escapeHtml(new Date().toLocaleString('id-ID'))}</div>
              </div>
            </div>

            <div class="section-title">Ringkasan Laporan</div>
            <div class="summary-grid">${buildSummaryRows(summary)}</div>

            <div class="section-title">Data Laporan</div>
            <div class="table-wrap">
              <table class="report-table">
                <thead>${buildTableHead(data)}</thead>
                <tbody>${buildTableBody(data)}</tbody>
              </table>
            </div>

            <div class="signature-wrap">
              <div class="signature-box">
                <div class="signature-label">Mengetahui,</div>
                <div class="signature-space"></div>
                <div class="signature-name">Admin NataKala</div>
                <div class="signature-role">Administrator Sistem Inventaris</div>
              </div>
            </div>

            <div class="footer">
              <span><strong>NataKala</strong> E-Inventory</span>
              <span>Dokumen laporan ini dibuat otomatis oleh sistem sebagai arsip operasional.</span>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function createExcelExport(reportType, report) {
  const title = `Laporan ${prettifyKey(reportType)}`;
  const subtitle = 'Dokumen laporan inventaris NataKala yang siap dibuka dan dirapikan lebih lanjut di spreadsheet.';
  const html = buildReportHtml({
    title,
    subtitle,
    summary: report.summary || {},
    data: report.data || [],
  });

  const blob = new Blob([html], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });

  return {
    mode: 'download',
    blob,
    filename: `laporan-${reportType}.xls`,
  };
}

export function createPdfExport(reportType, report, filters = {}) {
  const title = `Laporan ${prettifyKey(reportType)}`;
  const periodLabel =
    filters.period === 'all'
      ? 'Semua data'
      : filters.period === 'today'
        ? 'Periode hari ini'
        : filters.period === 'week'
          ? 'Periode minggu ini'
          : filters.period === 'month'
            ? 'Periode bulan ini'
            : filters.start_date && filters.end_date
              ? `Periode ${filters.start_date} s/d ${filters.end_date}`
              : 'Periode kustom';

  return {
    mode: 'print',
    title,
    html: buildReportHtml({
      title,
      subtitle: `Dokumen laporan inventaris NataKala | ${periodLabel}`,
      summary: report.summary || {},
      data: report.data || [],
    }),
  };
}

export default {
  createExcelExport,
  createPdfExport,
};
