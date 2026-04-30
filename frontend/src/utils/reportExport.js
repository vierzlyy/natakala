function prettifyKey(key) {
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

function buildSummaryRows(summary = {}) {
  return Object.entries(summary)
    .map(
      ([key, value]) => `
        <div class="metric-card">
          <div class="metric-label">${escapeHtml(prettifyKey(key))}</div>
          <div class="metric-value">${escapeHtml(value)}</div>
        </div>`,
    )
    .join('');
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

  return data
    .map(
      (row) => `
        <tr>
          ${Object.values(row)
            .map((value) => `<td>${escapeHtml(value)}</td>`)
            .join('')}
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
          body {
            font-family: "Segoe UI", Arial, Helvetica, sans-serif;
            background: #f8f6f2;
            color: #2b2b2b;
            margin: 0;
            padding: 24px;
          }
          .sheet {
            max-width: 1080px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #d6d3ce;
            border-radius: 22px;
            padding: 30px;
            box-shadow: 0 18px 40px rgba(43, 43, 43, 0.08);
          }
          .brand-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding-bottom: 18px;
            border-bottom: 1px solid #edeae5;
          }
          .brand-block {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .brand-chip {
            display: inline-flex;
            align-items: center;
            align-self: flex-start;
            padding: 8px 14px;
            border-radius: 999px;
            background: linear-gradient(135deg, rgba(77, 150, 255, 0.18), rgba(255, 217, 61, 0.2));
            color: #1e1e1e;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
          }
          h1 {
            margin: 0;
            font-size: 30px;
            color: #1e1e1e;
          }
          .subtitle {
            color: #6b6b6b;
            font-size: 14px;
            line-height: 1.6;
          }
          .meta-box {
            min-width: 230px;
            border: 1px solid #d6d3ce;
            border-radius: 16px;
            padding: 14px 16px;
            background: #faf9f6;
          }
          .meta-title {
            font-size: 12px;
            font-weight: 700;
            color: #6b6b6b;
            text-transform: uppercase;
            letter-spacing: 0.12em;
          }
          .meta-value {
            margin-top: 8px;
            font-size: 15px;
            font-weight: 700;
            color: #1e1e1e;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            margin-top: 24px;
          }
          .metric-card {
            border: 1px solid #d6d3ce;
            border-radius: 18px;
            padding: 16px 18px;
            background: linear-gradient(135deg, rgba(77, 150, 255, 0.08), rgba(255, 217, 61, 0.12));
          }
          .metric-label {
            font-size: 12px;
            font-weight: 700;
            color: #6b6b6b;
            text-transform: uppercase;
            letter-spacing: 0.12em;
          }
          .metric-value {
            margin-top: 10px;
            font-size: 26px;
            font-weight: 800;
            color: #1e1e1e;
          }
          .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 24px;
            border: 1px solid #d6d3ce;
            border-radius: 18px;
            overflow: hidden;
          }
          .report-table th {
            background: #edeae5;
            color: #1e1e1e;
            text-align: left;
            padding: 13px 12px;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }
          .report-table td {
            padding: 12px;
            border-bottom: 1px solid #edeae5;
            font-size: 13px;
            vertical-align: top;
          }
          .report-table tr:nth-child(even) td {
            background: #faf9f6;
          }
          .section-title {
            margin-top: 28px;
            margin-bottom: 12px;
            font-size: 16px;
            font-weight: 800;
            color: #1e1e1e;
          }
          .footer {
            margin-top: 22px;
            color: #6b6b6b;
            font-size: 12px;
            padding-top: 14px;
            border-top: 1px solid #edeae5;
          }
          .signature-wrap {
            display: flex;
            justify-content: flex-end;
            margin-top: 28px;
          }
          .signature-box {
            width: 280px;
            text-align: left;
          }
          .signature-label {
            font-size: 12px;
            color: #6b6b6b;
          }
          .signature-space {
            height: 56px;
          }
          .signature-name {
            font-size: 14px;
            font-weight: 800;
            color: #1e1e1e;
          }
          .signature-role {
            margin-top: 4px;
            font-size: 12px;
            color: #6b6b6b;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .sheet {
              border: 0;
              border-radius: 0;
              box-shadow: none;
              max-width: none;
              padding: 0;
            }
            .brand-row {
              margin-bottom: 12px;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="brand-row">
            <div class="brand-block">
              <div class="brand-chip">NataKala</div>
              <h1>${escapeHtml(title)}</h1>
              <div class="subtitle">${escapeHtml(subtitle)}</div>
            </div>
            <div class="meta-box">
              <div class="meta-title">Tanggal Export</div>
              <div class="meta-value">${escapeHtml(new Date().toLocaleString('id-ID'))}</div>
            </div>
          </div>
          <div class="section-title">Ringkasan</div>
          <div class="summary-grid">${buildSummaryRows(summary)}</div>
          <div class="section-title">Data Laporan</div>
          <table class="report-table">
            <thead>${buildTableHead(data)}</thead>
            <tbody>${buildTableBody(data)}</tbody>
          </table>
          <div class="signature-wrap">
            <div class="signature-box">
              <div class="signature-label">Mengetahui,</div>
              <div class="signature-space"></div>
              <div class="signature-name">Admin NataKala</div>
              <div class="signature-role">Administrator Sistem Inventaris</div>
            </div>
          </div>
          <div class="footer">NataKala - E-Inventory Toko/Gudang Pakaian | Dokumen diekspor otomatis dari sistem.</div>
        </div>
      </body>
    </html>
  `;
}

export function createExcelExport(reportType, report) {
  const title = `Laporan ${prettifyKey(reportType)}`;
  const subtitle =
    'NataKala - E-Inventory Toko/Gudang Pakaian | Dokumen Excel laporan inventaris yang siap dibuka dan dirapikan lebih lanjut di spreadsheet.';
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
      subtitle: `NataKala - E-Inventory Toko/Gudang Pakaian | ${periodLabel}`,
      summary: report.summary || {},
      data: report.data || [],
    }),
  };
}

export default {
  createExcelExport,
  createPdfExport,
};
