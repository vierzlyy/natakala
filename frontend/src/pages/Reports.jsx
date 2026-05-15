import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarRange, DatabaseBackup, Download, FileSpreadsheet, FileText, Filter, PackageSearch, Search, Trash2, TrendingUp } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import reportService from '../services/reportService';
import settingsService from '../services/settingsService';
import formatCurrency from '../utils/formatCurrency';
import { datedFilename, sanitizeFilename, saveBlob } from '../utils/fileDownload';

const reportTabs = [
  ['stock', 'Laporan Stok', 'Posisi stok per produk dan status ketersediaan.'],
  ['transactionsIn', 'Barang Masuk', 'Riwayat restock dan penerimaan barang dari supplier.'],
  ['returns', 'Barang Return', 'Barang masuk yang dikembalikan beserta kondisi dan catatan pemeriksaan.'],
  ['transactionsOut', 'Barang Keluar', 'Pergerakan stok keluar untuk penjualan, transfer, atau rusak.'],
  ['bestSeller', 'Produk Terlaris', 'Produk dengan performa penjualan tertinggi.'],
  ['inventoryValue', 'Nilai Inventaris', 'Estimasi nilai stok berdasarkan harga beli.'],
  ['mutasi', 'Mutasi Stok', 'Laporan gabungan barang masuk, keluar, dan sisa stok akhir.'],
  ['opname', 'Opname', 'Ringkasan hasil stock opname dan selisih stok.'],
];

const reportConfig = {
  stock: {
    tone: 'primary',
    accentClass: 'from-primary/12 via-primary/5 to-white',
    chartLabel: 'Jumlah Stok',
    chartKey: 'value',
  },
  transactionsIn: {
    tone: 'success',
    accentClass: 'from-success/16 via-success/6 to-white',
    chartLabel: 'Barang Masuk',
    chartKey: 'value',
  },
  returns: {
    tone: 'danger',
    accentClass: 'from-danger/12 via-warning/8 to-white',
    chartLabel: 'Barang Return',
    chartKey: 'value',
  },
  transactionsOut: {
    tone: 'warning',
    accentClass: 'from-warning/18 via-warning/7 to-white',
    chartLabel: 'Barang Keluar',
    chartKey: 'value',
  },
  bestSeller: {
    tone: 'primary',
    accentClass: 'from-primary/14 via-warning/10 to-white',
    chartLabel: 'Terjual',
    chartKey: 'value',
  },
  inventoryValue: {
    tone: 'warning',
    accentClass: 'from-warning/16 via-danger/6 to-white',
    chartLabel: 'Nilai',
    chartKey: 'value',
  },
  opname: {
    tone: 'danger',
    accentClass: 'from-danger/10 via-warning/8 to-white',
    chartLabel: 'Jumlah Item',
    chartKey: 'value',
  },
  mutasi: {
    tone: 'primary',
    accentClass: 'from-primary/14 via-success/10 to-white',
    chartLabel: 'Sisa Stok',
    chartKey: 'value',
  },
};

const deleteScopes = [
  {
    value: 'transactions',
    label: 'Semua transaksi',
    description: 'Menghapus barang masuk, barang keluar, dokumen transaksi, dan histori stok.',
  },
  {
    value: 'transactions_in',
    label: 'Barang masuk',
    description: 'Menghapus riwayat barang masuk dan dokumen terkait.',
  },
  {
    value: 'transactions_out',
    label: 'Barang keluar',
    description: 'Menghapus riwayat barang keluar.',
  },
  {
    value: 'stock_opname',
    label: 'Stock opname',
    description: 'Menghapus sesi dan item stock opname.',
  },
  {
    value: 'documents',
    label: 'Dokumen digital',
    description: 'Menghapus arsip dokumen digital.',
  },
  {
    value: 'all_inventory',
    label: 'Semua data pada bulan dipilih',
    description: 'Menghapus transaksi, dokumen, stock opname, histori stok, dan audit pada bulan yang dipilih. Master produk, kategori, supplier, pengaturan, dan akun login tetap ada.',
  },
];

const monthOptions = [
  ['01', 'Januari'],
  ['02', 'Februari'],
  ['03', 'Maret'],
  ['04', 'April'],
  ['05', 'Mei'],
  ['06', 'Juni'],
  ['07', 'Juli'],
  ['08', 'Agustus'],
  ['09', 'September'],
  ['10', 'Oktober'],
  ['11', 'November'],
  ['12', 'Desember'],
];

const currentDate = new Date();
const initialFilters = { period: 'all', month: String(currentDate.getMonth() + 1).padStart(2, '0'), year: String(currentDate.getFullYear()), start_date: '', end_date: '' };

function getMonthDateRange(year, month) {
  const safeYear = Number(year || currentDate.getFullYear());
  const safeMonth = Number(month || currentDate.getMonth() + 1);
  const lastDay = new Date(safeYear, safeMonth, 0).getDate();
  const monthText = String(safeMonth).padStart(2, '0');

  return {
    start_date: `${safeYear}-${monthText}-01`,
    end_date: `${safeYear}-${monthText}-${String(lastDay).padStart(2, '0')}`,
  };
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function resolvePeriodLabel(filters, reportType) {
  if (reportType === 'stock') {
    return 'Semua stok';
  }

  const today = new Date();

  if (filters.period === 'all') {
    return 'Semua data';
  }

  if (filters.period === 'today') {
    return `Hari ini (${formatDateLabel(today)})`;
  }

  if (filters.period === 'week') {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return `Minggu ini (${formatDateLabel(start)} - ${formatDateLabel(today)})`;
  }

  if (filters.period === 'month') {
    return `Bulan ini (${formatMonthLabel(today)})`;
  }

  if (filters.period === 'last_month') {
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return `Bulan lalu (${formatMonthLabel(lastMonth)})`;
  }

  if (filters.start_date && filters.end_date) {
    return `${filters.start_date} s/d ${filters.end_date}`;
  }

  return 'Periode kustom';
}

function monthName(value) {
  return monthOptions.find(([month]) => month === String(value).padStart(2, '0'))?.[1] || 'Bulan';
}

function filenamePeriodLabel(filters) {
  if (filters.period === 'custom' && filters.month && filters.year) {
    return `${monthName(filters.month)} ${filters.year}`;
  }

  if (filters.period === 'custom' && filters.start_date && filters.end_date) {
    return `${filters.start_date} sampai ${filters.end_date}`;
  }

  if (filters.period === 'all') {
    return 'Semua Data';
  }

  return 'Filter Aktif';
}

function fileExtension(filename, fallback) {
  const match = String(filename || '').match(/\.([a-z0-9]+)$/i);
  return match ? `.${match[1]}` : fallback;
}

function prettifyKey(key) {
  if (key === 'sku' || key === 'SKU') return 'SKU';
  return String(key || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValueByKey(key, value, reportType) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const normalizedKey = String(key || '').toLowerCase();
  if (normalizedKey === 'notes') {
    const cleanNotes = String(value).split('[NATAKALA_INBOUND_META]')[0].trim();
    return cleanNotes || '-';
  }

  const shouldFormatCurrency =
    reportType === 'inventoryValue' ||
    normalizedKey.includes('price') ||
    normalizedKey.includes('amount') ||
    normalizedKey.includes('value');

  if (typeof value === 'number' && shouldFormatCurrency) {
    return formatCurrency(value);
  }

  if (typeof value === 'number') {
    return new Intl.NumberFormat('id-ID').format(value);
  }

  return String(value);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function buildCombinedDocumentHtml(reports = [], filters = {}) {
  const generatedAt = new Date().toLocaleString('id-ID');
  const periodText = filters.period === 'custom' && filters.start_date && filters.end_date
    ? `${filters.start_date} s/d ${filters.end_date}`
    : filters.period === 'all'
      ? 'Semua data'
      : 'Filter aktif';

  const sections = reports
    .map(({ type: reportType, label, description, payload }) => {
      const data = payload.data || payload.items || [];
      const summary = payload.summary || {};
      const headers = data.length ? Object.keys(data[0]) : [];

      return `
        <section class="report-section">
          <div class="section-heading">
            <div>
              <h2>${escapeHtml(label)}</h2>
              <p>${escapeHtml(description)}</p>
            </div>
            <span class="count-badge">${escapeHtml(String(data.length))} data</span>
          </div>
          <div class="summary-grid">
            ${Object.entries(summary).map(([key, value]) => `
              <div class="summary-card">
                <strong>${escapeHtml(prettifyKey(key))}</strong>
                <div>${escapeHtml(formatValueByKey(key, value, reportType))}</div>
              </div>
            `).join('') || '<div class="summary-card"><strong>Ringkasan</strong><div>-</div></div>'}
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  ${headers.length ? headers.map((key) => `<th>${escapeHtml(prettifyKey(key))}</th>`).join('') : '<th>Data</th>'}
                </tr>
              </thead>
              <tbody>
                ${data.length
                  ? data.map((row) => `
                    <tr>
                      ${headers.map((key) => `<td>${escapeHtml(formatValueByKey(key, row[key], reportType))}</td>`).join('')}
                    </tr>
                  `).join('')
                  : '<tr><td>Tidak ada data laporan.</td></tr>'}
              </tbody>
            </table>
          </div>
        </section>
      `;
    })
    .join('');

  return `
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Laporan Inventaris Lengkap</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 20px;
            background: #f1f3f6;
            color: #111827;
            font-family: Arial, "Segoe UI", sans-serif;
            font-size: 12px;
            line-height: 1.45;
          }
          .sheet {
            max-width: 1120px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid #c8ced8;
            box-shadow: 0 14px 40px rgba(17, 24, 39, .10);
          }
          .brand-strip {
            height: 7px;
            background: linear-gradient(90deg, #111827 0 34%, #9a6a38 34% 100%);
          }
          .content {
            padding: 28px 32px 26px;
          }
          .header {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 260px;
            gap: 24px;
            align-items: start;
            border-bottom: 3px solid #111827;
            padding-bottom: 18px;
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
            text-transform: uppercase;
          }
          h2 {
            margin: 0;
            font-size: 17px;
            text-transform: uppercase;
          }
          p {
            margin: 6px 0 0;
            color: #5f6673;
          }
          .meta {
            border: 1px solid #cfd4dc;
            background: #fff;
          }
          .meta-title {
            background: #111827;
            color: #fff;
            padding: 8px 10px;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: .1em;
            text-transform: uppercase;
          }
          .meta-row {
            padding: 10px;
            border-top: 1px solid #e5e7eb;
          }
          .meta-row:first-of-type {
            border-top: 0;
          }
          .meta-row strong {
            display: block;
            color: #5f6673;
            font-size: 9px;
            letter-spacing: .08em;
            text-transform: uppercase;
          }
          .meta-row span {
            display: block;
            margin-top: 4px;
            font-weight: 800;
          }
          .report-section {
            margin-top: 16px;
            break-inside: auto;
            page-break-inside: auto;
          }
          .section-heading {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: flex-start;
            margin-bottom: 12px;
          }
          .count-badge {
            border: 1px solid #9a6a38;
            background: #f8f1e8;
            color: #5d3d1e;
            padding: 6px 10px;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: .08em;
            text-transform: uppercase;
            white-space: nowrap;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            border-top: 1px solid #cfd4dc;
            border-left: 1px solid #cfd4dc;
            margin-bottom: 14px;
          }
          .summary-card {
            border-right: 1px solid #cfd4dc;
            border-bottom: 1px solid #cfd4dc;
            padding: 11px 12px;
            background: #fff;
          }
          .summary-card strong {
            display: block;
            color: #5f6673;
            font-size: 9px;
            letter-spacing: .08em;
            text-transform: uppercase;
          }
          .summary-card div {
            margin-top: 7px;
            font-size: 17px;
            font-weight: 900;
          }
          .table-wrap {
            overflow-x: auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #cfd4dc;
          }
          th,
          td {
            border: 1px solid #e5e7eb;
            padding: 8px;
            text-align: left;
            vertical-align: top;
            font-size: 11px;
          }
          th {
            border-color: #cfd4dc;
            background: #e7eaf0;
            color: #111827;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .08em;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            margin-top: 28px;
            border-top: 1px solid #cfd4dc;
            padding-top: 12px;
            color: #5f6673;
            font-size: 10px;
          }
          .footer strong {
            color: #111827;
            letter-spacing: .08em;
            text-transform: uppercase;
          }
          @media print {
            @page { size: A4 landscape; margin: 12mm; }
            body {
              padding: 0;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .sheet {
              border: 0;
              box-shadow: none;
              max-width: none;
            }
            .content { padding: 0; }
            .brand-strip {
              height: 5px;
              margin-bottom: 16px;
            }
            .report-section {
              break-inside: auto;
              page-break-before: auto;
              page-break-inside: auto;
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
                  <div class="brand-name">NataKala E-Inventory</div>
                  <div class="brand-meta">Inventory Report Document</div>
                </div>
              </div>
              <h1>NataKala - Laporan Inventaris Lengkap</h1>
              <p>Dokumen gabungan seluruh laporan yang dipilih.</p>
            </div>
            <div class="meta">
              <div class="meta-title">Identitas Laporan</div>
              <div class="meta-row">
                <strong>Periode</strong>
                <span>${escapeHtml(periodText)}</span>
              </div>
              <div class="meta-row">
                <strong>Tanggal Export</strong>
                <span>${escapeHtml(generatedAt)}</span>
              </div>
            </div>
          </div>
          ${sections}
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

export default function Reports() {
  const [type, setType] = useState('stock');
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [report, setReport] = useState({ summary: {}, chart: [], data: [] });
  const [tableSearch, setTableSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');
  const [backingUp, setBackingUp] = useState(false);
  const [deletingData, setDeletingData] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    format: 'excel',
    period: 'current',
    month: initialFilters.month,
    year: initialFilters.year,
    reportTypes: ['stock'],
  });
  const [backupForm, setBackupForm] = useState({
    scope: 'all',
    month: initialFilters.month,
    year: initialFilters.year,
  });
  const [deleteForm, setDeleteForm] = useState({
    scope: 'transactions',
    month: initialFilters.month,
    year: initialFilters.year,
    confirmation: '',
  });
  const yearOptions = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    return Array.from({ length: 12 }, (_, index) => String(currentYear + 1 - index));
  }, []);

  const loadReport = async (nextType = type, nextFilters = filters) => {
    try {
      setLoading(true);
      const response = await reportService.getReport(nextType, nextFilters);
      const payload = response.data || response.report || response;
      setReport({
        summary: payload.summary || {},
        chart: payload.chart || [],
        data: payload.data || payload.items || [],
      });
      setAppliedFilters(nextFilters);
    } catch (error) {
      toast.error('Gagal memuat laporan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTableSearch('');
    loadReport(type, appliedFilters);
  }, [type]);

  const applyFilters = () => {
    if (filters.period === 'custom' && (!filters.start_date || !filters.end_date)) {
      toast.error('Tanggal mulai dan tanggal selesai wajib diisi untuk periode custom.');
      return;
    }

    loadReport(type, filters);
  };

  const handlePeriodChange = (period) => {
    setFilters((prev) => {
      if (period === 'custom') {
        const month = prev.month || initialFilters.month;
        const year = prev.year || initialFilters.year;

        return {
          ...prev,
          period,
          month,
          year,
          ...getMonthDateRange(year, month),
        };
      }

      return {
        ...prev,
        period,
        start_date: '',
        end_date: '',
      };
    });
  };

  const handleCustomMonthChange = (field, value) => {
    setFilters((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      return {
        ...next,
        ...getMonthDateRange(next.year, next.month),
      };
    });
  };

  const saveExportResult = async (result, kind, suggestedName) => {
    if (result.mode === 'print') {
      const printWindow = window.open('', '_blank', 'width=1080,height=900');
      if (!printWindow) {
        throw new Error('POPUP_BLOCKED');
      }
      printWindow.document.open();
      printWindow.document.write(result.html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 400);
      return;
    }

    const extension = fileExtension(result.filename, kind === 'excel' ? '.csv' : '.pdf');
    const saveResult = await saveBlob(result.blob, suggestedName || result.filename || datedFilename('NataKala Laporan', extension), [
      {
        description: kind === 'excel' ? 'Dokumen Excel atau CSV' : 'Dokumen PDF',
        accept: kind === 'excel'
          ? {
              'text/csv': ['.csv'],
              'application/vnd.ms-excel': ['.xls'],
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            }
          : { 'application/pdf': ['.pdf'] },
      },
    ]);

    if (saveResult.cancelled) {
      throw new Error('SAVE_CANCELLED');
    }
  };

  const handleExport = async (kind, exportType = type, exportFilters = appliedFilters) => {
    try {
      setExporting(kind);
      const result = kind === 'pdf' ? await reportService.exportPdf({ type: exportType, ...exportFilters }) : await reportService.exportExcel({ type: exportType, ...exportFilters });
      const tab = reportTabs.find(([value]) => value === exportType);
      const extension = fileExtension(result.filename, kind === 'excel' ? '.csv' : '.pdf');
      await saveExportResult(result, kind, datedFilename(`NataKala ${tab?.[1] || prettifyKey(exportType)} - ${filenamePeriodLabel(exportFilters)}`, extension));

      toast.success(`Export ${kind.toUpperCase()} berhasil.`);
    } catch (error) {
      toast.error(
        error.message === 'POPUP_BLOCKED'
          ? 'Popup diblokir browser. Izinkan popup untuk export PDF.'
          : error.message === 'SAVE_CANCELLED'
            ? 'Penyimpanan dokumen dibatalkan.'
          : `Gagal export ${kind.toUpperCase()}.`,
      );
    } finally {
      setExporting('');
    }
  };

  const documentFilters = () => {
    if (documentForm.period === 'month') {
      return {
        period: 'custom',
        month: documentForm.month,
        year: documentForm.year,
        ...getMonthDateRange(documentForm.year, documentForm.month),
      };
    }

    if (documentForm.period === 'all') {
      return { ...initialFilters, period: 'all' };
    }

    return appliedFilters;
  };

  const toggleDocumentReport = (reportType) => {
    setDocumentForm((prev) => {
      const exists = prev.reportTypes.includes(reportType);
      const reportTypes = exists
        ? prev.reportTypes.filter((item) => item !== reportType)
        : [...prev.reportTypes, reportType];

      return { ...prev, reportTypes };
    });
  };

  const openDocumentModal = () => {
    setDocumentForm((prev) => ({
      ...prev,
      reportTypes: [type],
    }));
    setExportModalOpen(true);
  };

  const handleSaveDocuments = async () => {
    if (!documentForm.reportTypes.length) {
      toast.error('Pilih minimal satu jenis laporan.');
      return;
    }

    try {
      setExporting(documentForm.format);
      const exportFilters = documentFilters();

      if (documentForm.reportTypes.length === 1) {
        const reportType = documentForm.reportTypes[0];
        const result =
          documentForm.format === 'pdf'
            ? await reportService.exportPdf({ type: reportType, ...exportFilters })
            : await reportService.exportExcel({ type: reportType, ...exportFilters });
        const tab = reportTabs.find(([value]) => value === reportType);
        const extension = fileExtension(result.filename, documentForm.format === 'excel' ? '.csv' : '.pdf');
        await saveExportResult(result, documentForm.format, datedFilename(`NataKala ${tab?.[1] || prettifyKey(reportType)} - ${filenamePeriodLabel(exportFilters)}`, extension));
      } else {
        const reports = await Promise.all(
          documentForm.reportTypes.map(async (reportType) => {
            const response = await reportService.getReport(reportType, exportFilters);
            const payload = response.data || response.report || response;
            const tab = reportTabs.find(([value]) => value === reportType);

            return {
              type: reportType,
              label: tab?.[1] || prettifyKey(reportType),
              description: tab?.[2] || '',
              payload: {
                summary: payload.summary || {},
                data: payload.data || payload.items || [],
              },
            };
          }),
        );
        const html = buildCombinedDocumentHtml(reports, exportFilters);

        if (documentForm.format === 'pdf') {
          await saveExportResult({ mode: 'print', html }, 'pdf', datedFilename(`NataKala Laporan Inventaris Lengkap - ${filenamePeriodLabel(exportFilters)}`, '.pdf'));
        } else {
          await saveExportResult({
            mode: 'download',
            blob: new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' }),
            filename: 'laporan-inventaris-lengkap.xls',
          }, 'excel', datedFilename(`NataKala Laporan Inventaris Lengkap - ${filenamePeriodLabel(exportFilters)}`, '.xls'));
        }
      }

      toast.success('Dokumen laporan berhasil disimpan.');
      setExportModalOpen(false);
    } catch (error) {
      toast.error(
        error.message === 'POPUP_BLOCKED'
          ? 'Popup diblokir browser. Izinkan popup untuk menyimpan PDF.'
          : error.message === 'SAVE_CANCELLED'
            ? 'Penyimpanan dokumen dibatalkan.'
          : 'Gagal menyimpan dokumen laporan.',
      );
    } finally {
      setExporting('');
    }
  };

  const handleBackup = async () => {
    try {
      setBackingUp(true);
      const { blob } = await settingsService.backup({
        scope: backupForm.scope,
        month: Number(backupForm.month),
        year: Number(backupForm.year),
      });
      const backupName = backupForm.scope === 'month'
        ? `NataKala Backup Database - ${monthName(backupForm.month)} ${backupForm.year}.json`
        : datedFilename('NataKala Backup Database - Semua Data', '.json');
      const saveResult = await saveBlob(blob, sanitizeFilename(backupName), [
        {
          description: 'File Backup JSON',
          accept: { 'application/json': ['.json'] },
        },
      ]);

      if (saveResult.cancelled) {
        toast('Penyimpanan backup dibatalkan.');
        return;
      }

      toast.success('Backup seluruh data berhasil disimpan.');
      setBackupModalOpen(false);
    } catch (error) {
      toast.error('Gagal menyimpan backup database.');
    } finally {
      setBackingUp(false);
    }
  };

  const handleDeleteData = async () => {
    if (deleteForm.confirmation !== 'HAPUS') {
      toast.error('Ketik HAPUS untuk melanjutkan penghapusan data.');
      return;
    }

    try {
      setDeletingData(true);
      const response = await settingsService.deleteData({
        ...deleteForm,
        month: Number(deleteForm.month),
        year: Number(deleteForm.year),
      });
      toast.success(response?.message || 'Data berhasil dihapus.');
      setDeleteModalOpen(false);
      setDeleteForm((prev) => ({ ...prev, confirmation: '' }));
      loadReport(type, appliedFilters);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal menghapus data.');
    } finally {
      setDeletingData(false);
    }
  };

  const currentConfig = reportConfig[type] || reportConfig.stock;
  const activeTab = reportTabs.find(([value]) => value === type) || reportTabs[0];
  const periodLabel = resolvePeriodLabel(appliedFilters, type);

  const summaryEntries = useMemo(() => Object.entries(report.summary || {}), [report.summary]);

  const filteredData = useMemo(() => {
    const keyword = tableSearch.trim().toLowerCase();
    if (!keyword) return report.data || [];

    return (report.data || []).filter((row) =>
      Object.values(row || {}).some((value) => String(value ?? '').toLowerCase().includes(keyword)),
    );
  }, [report.data, tableSearch]);

  const dataProfile = useMemo(() => {
    const rows = filteredData || [];
    const allCells = rows.flatMap((row) => Object.values(row || {}));
    const filledCells = allCells.filter((value) => {
      const text = String(value ?? '').trim().toLowerCase();
      return text && text !== '-' && text !== 'tidak tersimpan' && text !== 'detail produk tidak tersimpan';
    });
    const completeness = allCells.length ? Math.round((filledCells.length / allCells.length) * 100) : 0;
    const totalQty = rows.reduce((sum, row) => sum + Number(row.quantity ?? row.total_items ?? row.stock ?? 0), 0);
    const totalAmount = rows.reduce((sum, row) => sum + Number(row.subtotal ?? row.total_amount ?? row.inventory_value ?? 0), 0);

    return {
      rows: rows.length,
      completeness,
      totalQty,
      totalAmount,
    };
  }, [filteredData]);

  const unifiedCards = useMemo(() => {
    return [
      {
        key: 'records',
        label: 'Total Baris Data',
        value: new Intl.NumberFormat('id-ID').format(filteredData.length),
        tone: 'primary',
        desc: 'Jumlah record transaksi/data.',
      },
      {
        key: 'quantity',
        label: 'Total Kuantitas',
        value: new Intl.NumberFormat('id-ID').format(dataProfile.totalQty),
        tone: 'success',
        desc: 'Akumulasi seluruh item terdata.',
      },
      {
        key: 'amount',
        label: 'Estimasi Nilai',
        value: formatCurrency(dataProfile.totalAmount),
        tone: 'warning',
        desc: 'Total perhitungan finansial.',
      },
      {
        key: 'completeness',
        label: 'Data Terbaca',
        value: `${dataProfile.completeness}%`,
        tone: 'danger',
        desc: 'Kelengkapan informasi data.',
      },
    ];
  }, [filteredData.length, dataProfile]);

  const normalizedChartData = useMemo(() => {
    return (report.chart || []).map((item, index) => ({
      label: item.label || `Data ${index + 1}`,
      value: Number(item.value ?? item.total ?? item.count ?? item.stock ?? 0),
    }));
  }, [report.chart]);

  const columns = useMemo(() => {
    if (!filteredData.length) return [{ key: 'empty', title: 'Data' }];

    return Object.keys(filteredData[0]).map((key) => ({
      key,
      title: prettifyKey(key),
      render: (row) => formatValueByKey(key, row[key], type),
    }));
  }, [filteredData, type]);

  return (
    <div className="space-y-5">
      <Card className="p-5 lg:p-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
          <div className="min-w-0">
            <h3 className="text-2xl font-bold text-ink">Laporan Inventaris</h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">Pantau performa inventaris, filter periode laporan, lalu ekspor dokumen dengan format rapi.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <Button variant="secondary" className="px-3 py-2 text-xs sm:text-sm" onClick={() => setBackupModalOpen(true)} loading={backingUp}>
              <DatabaseBackup size={16} />
              Backup
            </Button>
            <Button variant="danger" className="px-3 py-2 text-xs sm:text-sm" onClick={() => setDeleteModalOpen(true)} loading={deletingData}>
              <Trash2 size={16} />
              Hapus Data
            </Button>
            <Button className="px-3 py-2 text-xs sm:text-sm" onClick={openDocumentModal} loading={exporting === 'pdf' || exporting === 'excel'}>
              <FileText size={16} />
              Simpan Dokumen
            </Button>
          </div>
        </div>

        <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-2 scrollbar-thin">
          {reportTabs.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={[
                'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition',
                type === value ? 'border-primary bg-primary text-white shadow-panel' : 'border-line bg-white text-muted hover:border-primary hover:text-ink',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className={['min-w-0 rounded-[24px] border border-line bg-gradient-to-br p-5', currentConfig.accentClass].join(' ')}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-2xl bg-white/80 p-3 text-primary shadow-sm">
                <TrendingUp size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Laporan Aktif</p>
                <h4 className="mt-2 text-2xl font-extrabold text-ink">{activeTab[1]}</h4>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{activeTab[2]}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Badge tone={currentConfig.tone}>{periodLabel}</Badge>
              <Badge tone="muted">{filteredData.length} baris data</Badge>
              <Badge tone="muted">{normalizedChartData.length} titik grafik</Badge>
              <Badge tone={dataProfile.completeness >= 80 ? 'success' : 'warning'}>{dataProfile.completeness}% lengkap</Badge>
            </div>
          </div>

          <div className="rounded-[24px] border border-line bg-white p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="shrink-0 rounded-2xl bg-canvas p-3 text-primary">
                <Filter size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="text-lg font-bold text-ink">Filter Laporan</h4>
                <p className="text-sm text-muted">Atur periode sebelum melihat detail atau export.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Periode" as="select" value={filters.period} onChange={(e) => handlePeriodChange(e.target.value)}>
                <option value="all">Semua data</option>
                <option value="today">Hari ini</option>
                <option value="week">Minggu ini</option>
                <option value="month">Bulan ini</option>
                <option value="last_month">Bulan lalu</option>
                <option value="custom">Custom</option>
              </Input>
              <div className="rounded-[18px] border border-line bg-canvas px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Periode Aktif</p>
                <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink">
                  <CalendarRange size={16} className="shrink-0 text-primary" />
                  <span className="min-w-0 break-words">{periodLabel}</span>
                </div>
              </div>
              {filters.period === 'custom' ? (
                <>
                  <Input label="Bulan" as="select" value={filters.month} onChange={(e) => handleCustomMonthChange('month', e.target.value)}>
                    {monthOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Input>
                  <Input label="Tahun" as="select" value={filters.year} onChange={(e) => handleCustomMonthChange('year', e.target.value)}>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </Input>
                </>
              ) : null}
              <Input
                label="Tanggal Mulai"
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters((prev) => ({ ...prev, start_date: e.target.value }))}
                disabled={filters.period !== 'custom'}
                readOnly={filters.period === 'custom'}
              />
              <Input
                label="Tanggal Selesai"
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters((prev) => ({ ...prev, end_date: e.target.value }))}
                disabled={filters.period !== 'custom'}
                readOnly={filters.period === 'custom'}
              />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button onClick={applyFilters} loading={loading} className="w-full">
                <Download size={16} />
                Terapkan Filter
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const nextFilters = initialFilters;
                  setFilters(nextFilters);
                  loadReport(type, nextFilters);
                }}
                className="w-full"
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {unifiedCards.map((item) => {
          const bgColors = {
            primary: 'bg-primary/10',
            success: 'bg-success/15',
            warning: 'bg-warning/20',
            danger: 'bg-danger/10',
          };
          
          return (
            <Card key={item.key} className="p-3">
              <div className={`flex min-h-[132px] flex-col justify-between rounded-2xl p-4 ${bgColors[item.tone] || bgColors.primary}`}>
                <div>
                  <p className="text-sm font-medium text-muted">{item.label}</p>
                  <p className="mt-3 truncate text-2xl font-bold text-ink md:text-3xl">{item.value}</p>
                </div>
                <p className="mt-4 text-[13px] leading-5 text-muted">{item.desc}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-5 lg:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h4 className="text-xl font-bold text-ink">Grafik Laporan</h4>
              <p className="text-sm text-muted">Visualisasi ringkas untuk membaca pola data lebih cepat.</p>
            </div>
            <Badge tone={currentConfig.tone}>{currentConfig.chartLabel}</Badge>
          </div>
          <div className="h-[300px] min-w-0">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted">Memuat grafik...</div>
            ) : !normalizedChartData.length ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-line bg-canvas/70 px-4 text-center">
                <PackageSearch size={30} className="text-muted" />
                <div>
                  <p className="font-semibold text-ink">Grafik belum tersedia</p>
                  <p className="text-sm text-muted">Coba ubah periode atau pastikan datanya sudah tersedia.</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={normalizedChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D6D3CE" />
                  <XAxis dataKey="label" stroke="#6B6B6B" />
                  <YAxis stroke="#6B6B6B" />
                  <Tooltip formatter={(value) => formatValueByKey(currentConfig.chartKey, Number(value), type)} />
                  <Bar dataKey="value" fill="#4D96FF" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-5 lg:p-6">
          <h4 className="mb-4 text-xl font-bold text-ink">Ringkasan Detail</h4>
          <div className="space-y-3">
            {summaryEntries.length ? (
              summaryEntries.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-[18px] bg-white px-4 py-3">
                  <span className="min-w-0 text-sm font-semibold capitalize text-muted">{prettifyKey(key)}</span>
                  <Badge tone={currentConfig.tone}>{formatValueByKey(key, value, type)}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Belum ada ringkasan untuk laporan ini.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5 lg:p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h4 className="text-xl font-bold text-ink">Tabel Laporan</h4>
            <p className="text-sm text-muted">Data terformat untuk analisis detail dan pengecekan manual.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[260px]">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={tableSearch}
                onChange={(event) => setTableSearch(event.target.value)}
                className="h-10 w-full rounded-2xl border border-line bg-white pl-9 pr-3 text-sm outline-none transition focus:border-primary"
                placeholder="Cari data laporan"
              />
            </div>
            <Badge tone="muted">{filteredData.length} data</Badge>
          </div>
        </div>
        <Table columns={columns} data={filteredData} loading={loading} emptyMessage={`Tidak ada data untuk ${periodLabel}.`} />
      </Card>

      <Modal
        open={exportModalOpen}
        title="Simpan Dokumen Laporan"
        onClose={() => setExportModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setExportModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveDocuments} loading={exporting === documentForm.format}>
              {documentForm.format === 'pdf' ? <FileText size={16} /> : <FileSpreadsheet size={16} />}
              Simpan Dokumen
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Format Dokumen"
              as="select"
              value={documentForm.format}
              onChange={(event) => setDocumentForm((prev) => ({ ...prev, format: event.target.value }))}
            >
              <option value="excel">Excel</option>
              <option value="pdf">PDF</option>
            </Input>
            <Input
              label="Periode Dokumen"
              as="select"
              value={documentForm.period}
              onChange={(event) => setDocumentForm((prev) => ({ ...prev, period: event.target.value }))}
            >
              <option value="current">Ikuti filter aktif</option>
              <option value="month">Pilih bulan dan tahun</option>
              <option value="all">Semua data</option>
            </Input>
          </div>

          {documentForm.period === 'month' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Bulan Laporan"
                as="select"
                value={documentForm.month}
                onChange={(event) => setDocumentForm((prev) => ({ ...prev, month: event.target.value }))}
              >
                {monthOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Input>
              <Input
                label="Tahun Laporan"
                as="select"
                value={documentForm.year}
                onChange={(event) => setDocumentForm((prev) => ({ ...prev, year: event.target.value }))}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Input>
            </div>
          ) : null}

          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-text">Laporan yang Mau Disimpan</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => setDocumentForm((prev) => ({ ...prev, reportTypes: [type] }))}>
                  Laporan Aktif
                </Button>
                <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => setDocumentForm((prev) => ({ ...prev, reportTypes: reportTabs.map(([value]) => value) }))}>
                  Pilih Semua
                </Button>
                <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => setDocumentForm((prev) => ({ ...prev, reportTypes: [] }))}>
                  Kosongkan
                </Button>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {reportTabs.map(([value, label, description]) => {
                const checked = documentForm.reportTypes.includes(value);

                return (
                  <label
                    key={value}
                    className={[
                      'flex cursor-pointer items-start gap-3 rounded-[18px] border bg-white p-4 transition',
                      checked ? 'border-primary ring-2 ring-primary/15' : 'border-line hover:border-primary/60',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-primary"
                      checked={checked}
                      onChange={() => toggleDocumentReport(value)}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-ink">{label}</span>
                      <span className="mt-1 block text-xs leading-5 text-muted">{description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="rounded-[22px] border border-line bg-white p-4 text-sm leading-6 text-muted">
            {documentForm.period === 'current'
              ? `Dokumen akan memakai filter aktif: ${periodLabel}.`
              : documentForm.period === 'all'
                ? 'Dokumen akan membaca semua data dari laporan yang dipilih.'
                : `Dokumen akan membaca data bulan ${monthOptions.find(([value]) => value === documentForm.month)?.[1]} ${documentForm.year}.`}
          </div>
        </div>
      </Modal>

      <Modal
        open={backupModalOpen}
        title="Simpan Backup"
        onClose={() => setBackupModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setBackupModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleBackup} loading={backingUp}>
              <DatabaseBackup size={16} />
              Download Backup
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Jenis Backup"
              as="select"
              value={backupForm.scope}
              onChange={(event) => setBackupForm((prev) => ({ ...prev, scope: event.target.value }))}
              containerClassName="md:col-span-2"
            >
              <option value="all">Backup semua data</option>
              <option value="month">Backup data per bulan</option>
            </Input>

            {backupForm.scope === 'month' ? (
              <>
                <Input
                  label="Bulan Backup"
                  as="select"
                  value={backupForm.month}
                  onChange={(event) => setBackupForm((prev) => ({ ...prev, month: event.target.value }))}
                >
                  {monthOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Input>
                <Input
                  label="Tahun Backup"
                  as="select"
                  value={backupForm.year}
                  onChange={(event) => setBackupForm((prev) => ({ ...prev, year: event.target.value }))}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Input>
              </>
            ) : null}
          </div>

          <div className="rounded-[22px] border border-line bg-white p-4 text-sm leading-6 text-muted">
            {backupForm.scope === 'all'
              ? 'Backup semua data akan mengunduh seluruh data inventaris yang tersimpan di website.'
              : 'Backup per bulan akan mengunduh master data yang dibutuhkan dan data transaksi/dokumen/opname pada bulan yang dipilih.'}
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteModalOpen}
        title="Hapus Data"
        onClose={() => setDeleteModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteData}
              loading={deletingData}
              disabled={deleteForm.confirmation !== 'HAPUS'}
            >
              <Trash2 size={16} />
              Hapus Data
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="rounded-[22px] border border-danger/20 bg-danger/10 p-4 text-sm leading-6 text-danger">
            Pilih data yang ingin dihapus. Data yang sudah dihapus hanya bisa dikembalikan dari file backup yang pernah disimpan.
          </div>

          <Input
            label="Data yang Mau Dihapus"
            as="select"
            value={deleteForm.scope}
            onChange={(event) => setDeleteForm((prev) => ({ ...prev, scope: event.target.value }))}
          >
            {deleteScopes.map((scope) => (
              <option key={scope.value} value={scope.value}>
                {scope.label}
              </option>
            ))}
          </Input>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Bulan Data"
              as="select"
              value={deleteForm.month}
              onChange={(event) => setDeleteForm((prev) => ({ ...prev, month: event.target.value }))}
            >
              {monthOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Input>
            <Input
              label="Tahun Data"
              as="select"
              value={deleteForm.year}
              onChange={(event) => setDeleteForm((prev) => ({ ...prev, year: event.target.value }))}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Input>
          </div>

          <div className="rounded-[22px] border border-line bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Dampak Penghapusan</p>
            <p className="mt-2 text-sm leading-6 text-ink">
              {deleteScopes.find((scope) => scope.value === deleteForm.scope)?.description}
            </p>
            <p className="mt-2 text-sm font-semibold text-ink">
              Periode: {monthOptions.find(([value]) => value === deleteForm.month)?.[1]} {deleteForm.year}
            </p>
          </div>

          <Input
            label="Konfirmasi"
            value={deleteForm.confirmation}
            onChange={(event) => setDeleteForm((prev) => ({ ...prev, confirmation: event.target.value }))}
            placeholder="Ketik HAPUS"
          />
        </div>
      </Modal>
    </div>
  );
}
