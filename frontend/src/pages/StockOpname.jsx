import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Pagination from '../components/ui/Pagination';
import SearchableSelect from '../components/ui/SearchableSelect';
import Table from '../components/ui/Table';
import productService from '../services/productService';
import transactionService from '../services/transactionService';
import { getErrorMessage } from '../services/serviceUtils';
import { formatProductColor, formatSizeStockSummary } from '../utils/productVariant';

const formatSizeInfo = (row) => {
  if (row.size_summary) return row.size_summary;
  return formatSizeStockSummary(row);
};

const RECOUNT_REASON = 'Perlu di data ulang';

function formatSessionStatus(status) {
  const labels = {
    open: 'Aktif',
    paused: 'Dijeda',
    review: 'Menunggu Penyesuaian',
    closed: 'Selesai',
    idle: 'Belum Dimulai',
  };

  return labels[status] || status || 'Belum Dimulai';
}

export default function StockOpname() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [scanForm, setScanForm] = useState({ barcode: '', physical_stock: '', reason: '' });
  const [sessionPage, setSessionPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadSessions = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const [response, productResponse] = await Promise.all([
        transactionService.getStockOpname(),
        productService.getAll({ page: 1, per_page: 1000 }),
      ]);
      const list = response.data || [];
      setSessions(list);
      setProducts(productResponse.data || []);
      const ongoing =
        list.find((item) => item.status === 'open') ||
        list.find((item) => item.status === 'review') ||
        list[0] ||
        null;
      setActiveSession(ongoing);
    } catch (error) {
      const message = getErrorMessage(error, 'Gagal memuat sesi stock opname.');
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    setSessionPage(1);
  }, [sessions.length]);

  const selectedScanProduct = useMemo(
    () =>
      products.find(
        (product) =>
          String(product.barcode || '') === String(scanForm.barcode || '') ||
          String(product.sku || '') === String(scanForm.barcode || '') ||
          String(product.id || '') === String(scanForm.barcode || ''),
      ),
    [products, scanForm.barcode],
  );

  const startSession = async () => {
    const existingSession =
      sessions.find((session) => session.status === 'open') ||
      sessions.find((session) => session.status === 'review') ||
      sessions.find((session) => session.status === 'paused');

    if (existingSession) {
      setActiveSession(existingSession);
      toast('Masih ada sesi opname aktif. Lanjutkan sesi yang sudah ada terlebih dahulu.', {
        icon: 'ℹ️',
      });
      return;
    }

    try {
      setSaving(true);
      const response = await transactionService.startStockOpname({});
      toast.success('Sesi opname baru berhasil dibuat.');
      setActiveSession(response.data || response.session || response);
      loadSessions();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gagal memulai sesi opname.');
    } finally {
      setSaving(false);
    }
  };

  const submitScan = async (event) => {
    event.preventDefault();

    if (!activeSession?.id) {
      toast.error('Mulai sesi opname terlebih dahulu.');
      return;
    }

    if (!scanForm.barcode.trim()) {
      toast.error('Barcode produk atau SKU wajib diisi.');
      return;
    }

    if (scanForm.physical_stock === '') {
      toast.error('Stok fisik wajib diisi.');
      return;
    }

    if (Number(scanForm.physical_stock) < 0) {
      toast.error('Stok fisik tidak boleh negatif.');
      return;
    }

    const physicalStock = Number(scanForm.physical_stock || 0);
    const systemStock = Number(selectedScanProduct?.stock || 0);
    const shouldRecount = selectedScanProduct && physicalStock > systemStock;
    const scanPayload = {
      ...scanForm,
      reason: shouldRecount && !scanForm.reason.trim() ? RECOUNT_REASON : scanForm.reason,
    };

    const normalizedBarcode = scanForm.barcode.trim().toLowerCase();
    const duplicateItem = (activeSession.items || []).find(
      (item) =>
        String(item.barcode || '').trim().toLowerCase() === normalizedBarcode ||
        String(item.sku || item.product_sku || '').trim().toLowerCase() === normalizedBarcode ||
        String(item.product_name || '').trim().toLowerCase() === normalizedBarcode,
    );

    if (duplicateItem) {
      toast.error('Barang ini sudah tercatat pada sesi opname yang sama.');
      return;
    }

    try {
      setSaving(true);
      const response = await transactionService.scanStockOpname(activeSession.id, scanPayload);
      toast.success('Barang berhasil ditambahkan ke sesi opname.');
      setActiveSession(response.data || response.session || response);
      setScanForm({ barcode: '', physical_stock: '', reason: '' });
      loadSessions();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal menyimpan input opname.'));
    } finally {
      setSaving(false);
    }
  };

  const applyAdjustment = async () => {
    if (!activeSession?.id) {
      toast.error('Tidak ada sesi aktif.');
      return;
    }

    if (!(activeSession.items || []).length) {
      toast.error('Belum ada item opname untuk disimpan.');
      return;
    }

    try {
      setSaving(true);
      await transactionService.adjustStockOpname(activeSession.id, {
        items: activeSession.items || [],
      });
      toast.success('Penyesuaian stok berhasil diterapkan.');
      loadSessions();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal menerapkan penyesuaian.'));
    } finally {
      setSaving(false);
    }
  };

  const itemColumns = useMemo(
    () => [
      { key: 'barcode', title: 'Barcode' },
      {
        key: 'product_name',
        title: 'Produk',
        render: (row) => (
          <div>
            <p className="font-semibold text-ink">{row.product_name}</p>
            <p className="text-xs text-muted">Ukuran: {formatSizeInfo(row)}</p>
            <p className="text-xs text-muted">Warna: {formatProductColor(row)}</p>
          </div>
        ),
      },
      { key: 'system_stock', title: 'Stok Sistem' },
      { key: 'physical_stock', title: 'Stok Fisik' },
      {
        key: 'difference',
        title: 'Selisih',
        render: (row) => (
          <Badge tone={Number(row.difference) === 0 ? 'success' : 'warning'}>
            {Number(row.difference) > 0 ? `+${row.difference}` : row.difference}
          </Badge>
        ),
      },
      {
        key: 'reason',
        title: 'Alasan',
        render: (row) => row.reason || (Number(row.difference || 0) > 0 ? RECOUNT_REASON : '-'),
      },
    ],
    [],
  );

  const summaryCards = [
    ['Total Scan', activeSession?.summary?.total_scanned || activeSession?.items?.length || 0, 'primary'],
    ['Sesuai', activeSession?.summary?.matched || 0, 'success'],
    ['Selisih', activeSession?.summary?.discrepancy || 0, 'warning'],
  ];

  const sessionPageSize = 15;
  const sessionTotalPages = Math.max(1, Math.ceil(sessions.length / sessionPageSize));
  const visibleSessions = useMemo(() => {
    const start = (sessionPage - 1) * sessionPageSize;
    return sessions.slice(start, start + sessionPageSize);
  }, [sessionPage, sessions]);

  const productOptions = useMemo(
    () =>
      [...products]
        .sort((first, second) => String(first.name || '').localeCompare(String(second.name || '')))
        .map((product) => ({
          value: product.barcode || product.sku || product.id,
          label: [
            product.sku,
            product.name,
            product.barcode ? `Barcode: ${product.barcode}` : '',
            formatProductColor(product),
            formatSizeStockSummary(product),
          ]
            .filter(Boolean)
            .join(' | '),
        })),
    [products],
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            {errorMessage}
          </div>
        ) : null}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-ink">Stock Opname</h3>
            <p className="mt-1 max-w-2xl text-sm leading-7 text-muted">
              Gunakan halaman ini untuk mencatat stok fisik barang di gudang dengan memasukkan barcode produk
              atau SKU, membandingkannya dengan stok sistem, lalu menyimpan penyesuaian dengan lebih rapi.
            </p>
          </div>
          <Button onClick={startSession} loading={saving}>
            Mulai Sesi Baru
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col gap-4 rounded-[24px] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Sesi Aktif</p>
                <h4 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-ink">
                  {activeSession?.session_no || 'Belum Ada Sesi'}
                </h4>
                <p className="mt-2 text-sm text-muted">
                  {activeSession?.created_at || 'Mulai sesi baru untuk melakukan pemeriksaan stok fisik.'}
                </p>
              </div>
              <Badge tone={activeSession?.status === 'closed' ? 'muted' : 'primary'} className="self-start sm:self-center">
                {formatSessionStatus(activeSession?.status || 'idle')}
              </Badge>
            </div>

            <div className="mt-6">
              <div className="mb-4">
                <h5 className="text-lg font-bold text-ink">Input Barang Opname</h5>
                <p className="text-sm text-muted">
                  Masukkan barcode produk yang sudah dibuat sistem atau ketik SKU, lalu isi jumlah stok fisik
                  yang ditemukan.
                </p>
              </div>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={submitScan}>
                <SearchableSelect
                  label="Barcode Produk / SKU"
                  name="barcode"
                  value={scanForm.barcode}
                  onChange={(e) => setScanForm((prev) => ({ ...prev, barcode: e.target.value }))}
                  options={productOptions}
                  placeholder="Ketik nama produk, SKU, atau barcode"
                />
                <Input
                  label="Stok Fisik"
                  type="number"
                  value={scanForm.physical_stock}
                  onChange={(e) => setScanForm((prev) => ({ ...prev, physical_stock: e.target.value }))}
                  placeholder="Masukkan jumlah barang fisik"
                />
                <Input
                  label="Alasan Selisih"
                  value={scanForm.reason}
                  onChange={(e) => setScanForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder={
                    selectedScanProduct && Number(scanForm.physical_stock || 0) > Number(selectedScanProduct.stock || 0)
                      ? RECOUNT_REASON
                      : 'Opsional, isi jika ada perbedaan stok'
                  }
                  containerClassName="md:col-span-2"
                />
                <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row">
                  <Button type="submit" loading={saving} className="sm:min-w-[180px]">
                    Simpan Barang
                  </Button>
                  <Button variant="warning" type="button" onClick={applyAdjustment} loading={saving} className="sm:min-w-[200px]">
                    Simpan Penyesuaian
                  </Button>
                </div>
              </form>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {summaryCards.map(([label, value, tone]) => (
              <Card key={label} className="p-5">
                <div className="rounded-[24px] bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-muted">{label}</p>
                      <p className="mt-2 text-3xl font-extrabold text-ink">{value}</p>
                    </div>
                    <Badge tone={tone}>{label}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-6">
          <div className="mb-4">
            <h4 className="text-xl font-bold text-ink">Riwayat Sesi</h4>
            <p className="text-sm text-muted">Pilih sesi yang ingin dilihat untuk meninjau hasil opname sebelumnya.</p>
          </div>
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted">Memuat sesi opname...</p>
            ) : sessions.length ? (
              visibleSessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setActiveSession(session)}
                  className={[
                    'w-full rounded-[24px] border p-4 text-left transition',
                    activeSession?.id === session.id
                      ? 'border-primary bg-primary/5'
                      : 'border-line bg-white hover:border-primary',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-ink">{session.session_no}</p>
                      <p className="text-sm text-muted">{session.created_at || session.date}</p>
                    </div>
                    <Badge tone={session.status === 'closed' ? 'muted' : 'primary'}>{formatSessionStatus(session.status)}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted">
                    <div className="rounded-2xl bg-canvas px-3 py-2">
                      <span className="block">Scan</span>
                      <span className="mt-1 block font-semibold text-ink">{session.summary?.total_scanned || session.items?.length || 0}</span>
                    </div>
                    <div className="rounded-2xl bg-canvas px-3 py-2">
                      <span className="block">Sesuai</span>
                      <span className="mt-1 block font-semibold text-ink">{session.summary?.matched || 0}</span>
                    </div>
                    <div className="rounded-2xl bg-canvas px-3 py-2">
                      <span className="block">Selisih</span>
                      <span className="mt-1 block font-semibold text-ink">{session.summary?.discrepancy || 0}</span>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-muted">Belum ada sesi opname.</p>
            )}
          </div>
          <div className="mt-4">
            <Pagination
              currentPage={sessionPage}
              totalPages={sessionTotalPages}
              totalItems={sessions.length}
              pageSize={sessionPageSize}
              onChange={setSessionPage}
            />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <h4 className="text-xl font-bold text-ink">Detail Item Opname</h4>
          <p className="text-sm text-muted">Tabel ini menampilkan hasil perbandingan stok sistem dan stok fisik pada sesi yang dipilih.</p>
        </div>
        <Table
          columns={itemColumns}
          data={activeSession?.items || []}
          loading={loading}
          emptyMessage="Belum ada item pada sesi ini."
        />
      </Card>
    </div>
  );
}
