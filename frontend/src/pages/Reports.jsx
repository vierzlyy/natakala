import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, CalendarRange, Download, FileSpreadsheet, FileText, Filter, PackageSearch, Search, TrendingUp, Package } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import reportService from '../services/reportService';
import formatCurrency from '../utils/formatCurrency';

const reportTabs = [
  ['stock', 'Laporan Stok', 'Posisi stok per produk dan status ketersediaan.'],
  ['transactionsIn', 'Barang Masuk', 'Riwayat restock dan penerimaan barang dari supplier.'],
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

export default function Reports() {
  const [type, setType] = useState('stock');
  const [filters, setFilters] = useState({ period: 'month', start_date: '', end_date: '' });
  const [report, setReport] = useState({ summary: {}, chart: [], data: [] });
  const [tableSearch, setTableSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

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
    } catch (error) {
      toast.error('Gagal memuat laporan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTableSearch('');
    loadReport();
  }, [type]);

  const handleExport = async (kind) => {
    try {
      setExporting(kind);
      const result = kind === 'pdf' ? await reportService.exportPdf({ type, ...filters }) : await reportService.exportExcel({ type, ...filters });

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
      } else {
        const url = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        link.click();
        window.URL.revokeObjectURL(url);
      }

      toast.success(`Export ${kind.toUpperCase()} berhasil.`);
    } catch (error) {
      toast.error(
        error.message === 'POPUP_BLOCKED'
          ? 'Popup diblokir browser. Izinkan popup untuk export PDF.'
          : `Gagal export ${kind.toUpperCase()}.`,
      );
    } finally {
      setExporting('');
    }
  };

  const currentConfig = reportConfig[type] || reportConfig.stock;
  const activeTab = reportTabs.find(([value]) => value === type) || reportTabs[0];
  const periodLabel =
    filters.period === 'all'
      ? 'Semua data'
      : filters.period === 'today'
      ? 'Hari ini'
      : filters.period === 'week'
        ? 'Minggu ini'
        : filters.period === 'month'
          ? 'Bulan ini'
          : filters.period === 'last_month'
            ? 'Bulan lalu'
            : filters.start_date && filters.end_date
              ? `${filters.start_date} s/d ${filters.end_date}`
              : 'Periode kustom';

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
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-ink">Laporan Inventaris</h3>
            <p className="text-sm text-muted">Pantau performa inventaris, filter periode laporan, lalu ekspor dokumen dengan format rapi.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => handleExport('pdf')} loading={exporting === 'pdf'}>
              <FileText size={16} />
              Export PDF
            </Button>
            <Button onClick={() => handleExport('excel')} loading={exporting === 'excel'}>
              <FileSpreadsheet size={16} />
              Export Excel
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {reportTabs.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={[
                'rounded-full border px-4 py-2 text-sm font-semibold transition',
                type === value ? 'border-primary bg-primary text-white shadow-panel' : 'border-line bg-white text-muted hover:border-primary hover:text-ink',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className={['rounded-[28px] border border-line bg-gradient-to-br p-5', currentConfig.accentClass].join(' ')}>
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/80 p-3 text-primary shadow-sm">
                <TrendingUp size={22} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Laporan Aktif</p>
                <h4 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-ink">{activeTab[1]}</h4>
                <p className="mt-2 text-sm leading-6 text-muted">{activeTab[2]}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Badge tone={currentConfig.tone}>{periodLabel}</Badge>
              <Badge tone="muted">{filteredData.length} baris data</Badge>
              <Badge tone="muted">{normalizedChartData.length} titik grafik</Badge>
              <Badge tone={dataProfile.completeness >= 80 ? 'success' : 'warning'}>{dataProfile.completeness}% lengkap</Badge>
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-white p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-canvas p-3 text-primary">
                <Filter size={20} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-ink">Filter Laporan</h4>
                <p className="text-sm text-muted">Atur periode sebelum melihat detail atau export.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Periode" as="select" value={filters.period} onChange={(e) => setFilters((prev) => ({ ...prev, period: e.target.value }))}>
                <option value="all">Semua data</option>
                <option value="today">Hari ini</option>
                <option value="week">Minggu ini</option>
                <option value="month">Bulan ini</option>
                <option value="last_month">Bulan lalu</option>
                <option value="custom">Custom</option>
              </Input>
              <div className="rounded-[22px] border border-line bg-canvas px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Periode Aktif</p>
                <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink">
                  <CalendarRange size={16} className="text-primary" />
                  {periodLabel}
                </div>
              </div>
              <Input
                label="Tanggal Mulai"
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters((prev) => ({ ...prev, start_date: e.target.value }))}
                disabled={filters.period !== 'custom'}
              />
              <Input
                label="Tanggal Selesai"
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters((prev) => ({ ...prev, end_date: e.target.value }))}
                disabled={filters.period !== 'custom'}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={loadReport} loading={loading}>
                <Download size={16} />
                Terapkan Filter
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const nextFilters = { period: 'all', start_date: '', end_date: '' };
                  setFilters(nextFilters);
                  loadReport(type, nextFilters);
                }}
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {unifiedCards.map((item) => {
          const bgColors = {
            primary: 'bg-primary/10',
            success: 'bg-success/15',
            warning: 'bg-warning/20',
            danger: 'bg-danger/10',
          };
          
          return (
            <Card key={item.key} className="p-3">
              <div className={`flex h-full flex-col justify-between rounded-2xl p-5 ${bgColors[item.tone] || bgColors.primary}`}>
                <div>
                  <p className="text-sm font-medium text-muted">{item.label}</p>
                  <p className="mt-3 text-3xl font-bold text-ink">{item.value}</p>
                </div>
                <p className="mt-6 text-[13px] text-muted">{item.desc}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xl font-bold text-ink">Grafik Laporan</h4>
              <p className="text-sm text-muted">Visualisasi ringkas untuk membaca pola data lebih cepat.</p>
            </div>
            <Badge tone={currentConfig.tone}>{currentConfig.chartLabel}</Badge>
          </div>
          <div className="h-[320px]">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted">Memuat grafik...</div>
            ) : !normalizedChartData.length ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-line bg-canvas/70 text-center">
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

        <Card className="p-6">
          <h4 className="mb-4 text-xl font-bold text-ink">Ringkasan Detail</h4>
          <div className="space-y-3">
            {summaryEntries.length ? (
              summaryEntries.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded-[22px] bg-white px-4 py-3">
                  <span className="text-sm font-semibold capitalize text-muted">{prettifyKey(key)}</span>
                  <Badge tone={currentConfig.tone}>{formatValueByKey(key, value, type)}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Belum ada ringkasan untuk laporan ini.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-xl font-bold text-ink">Tabel Laporan</h4>
            <p className="text-sm text-muted">Data terformat untuk analisis detail dan pengecekan manual.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={tableSearch}
                onChange={(event) => setTableSearch(event.target.value)}
                className="h-10 rounded-2xl border border-line bg-white pl-9 pr-3 text-sm outline-none transition focus:border-primary"
                placeholder="Cari data laporan"
              />
            </div>
            <Badge tone="muted">{filteredData.length} data</Badge>
          </div>
        </div>
        <Table columns={columns} data={filteredData} loading={loading} emptyMessage="Belum ada data laporan." />
      </Card>
    </div>
  );
}
