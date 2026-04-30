import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, Printer } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Pagination from '../components/ui/Pagination';
import Table from '../components/ui/Table';
import documentService from '../services/documentService';
import { getErrorMessage } from '../services/serviceUtils';
import printDigitalDocument from '../utils/documentPrint';
import formatCurrency from '../utils/formatCurrency';
import { transactionItemSummaries } from '../utils/transactionItemSummary';

const initialFilters = {
  search: '',
  document_type: '',
  status: '',
  page: 1,
  per_page: 15,
};

function documentTypeLabel(type) {
  if (type === 'SURAT_JALAN') return 'Surat Jalan';
  if (type === 'FAKTUR') return 'Faktur Pembelian';
  return 'GRN / Nota Intern';
}

function statusTone(status) {
  if (status === 'Selesai' || status === 'Diterima' || status === 'Tercatat') return 'success';
  if (status === 'Draft') return 'warning';
  return 'muted';
}

function documentAmount(row = {}) {
  const amount = Number(row.total_amount || 0);
  if (amount > 0) return amount;

  return (row.items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.purchase_price || 0),
    0,
  );
}

export default function Documents() {
  const [filters, setFilters] = useState(initialFilters);
  const [query, setQuery] = useState(initialFilters);
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await documentService.getAll(query);
      setDocuments(response.data || []);
      setPagination({
        current_page: response.pagination?.current_page || 1,
        last_page: response.pagination?.last_page || 1,
        total: response.pagination?.total || response.data?.length || 0,
      });
    } catch (error) {
      const message = getErrorMessage(error, 'Gagal memuat dokumen digital.');
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [query]);

  const printDocument = (document) => {
    try {
      printDigitalDocument(document);
    } catch (error) {
      toast.error('Popup diblokir browser. Izinkan popup untuk cetak dokumen.');
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'document_no',
        title: 'Dokumen',
        render: (row) => (
          <div>
            <p className="font-semibold text-ink">{row.document_no}</p>
            <p className="text-xs text-muted">{documentTypeLabel(row.document_type)}</p>
          </div>
        ),
      },
      { key: 'transaction_no', title: 'Transaksi' },
      { key: 'supplier_name', title: 'Supplier' },
      { key: 'date', title: 'Tanggal' },
      {
        key: 'status',
        title: 'Status',
        render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
      },
      {
        key: 'total_items',
        title: 'Total Item',
        render: (row) => (
          <div className="min-w-[260px]">
            <p className="font-semibold text-ink">{row.total_items || 0} pcs</p>
            <div className="mt-1 space-y-1">
              {transactionItemSummaries(row.items || []).map((detail, index) => (
                <p key={`${row.id || row.document_no}-${index}`} className="text-xs leading-5 text-muted">
                  {detail}
                </p>
              ))}
            </div>
          </div>
        ),
      },
      {
        key: 'total_amount',
        title: 'Nilai',
        render: (row) => formatCurrency(documentAmount(row)),
      },
      {
        key: 'actions',
        title: 'Aksi',
        render: (row) => (
          <Button variant="secondary" className="px-3 py-2 text-xs" onClick={() => printDocument(row)}>
            <Printer size={14} />
            Cetak
          </Button>
        ),
      },
    ],
    [],
  );

  const handleSearch = (event) => {
    event.preventDefault();
    setQuery({ ...filters, page: 1 });
  };

  const changePage = (page) => {
    if (page < 1 || page > pagination.last_page) return;
    setFilters((prev) => ({ ...prev, page }));
    setQuery((prev) => ({ ...prev, page }));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-primary">
              <FileText size={16} />
              Arsip dokumen barang masuk
            </div>
            <h3 className="text-2xl font-bold text-ink">Dokumentasi Digital</h3>
            <p className="mt-1 max-w-2xl text-sm leading-7 text-muted">
              GRN/Nota Intern, Surat Jalan, dan Faktur Pembelian dibuat otomatis dari transaksi barang masuk
              agar penerimaan stok punya arsip formal yang siap dicetak.
            </p>
          </div>
          <Badge tone="primary">{pagination.total} dokumen</Badge>
        </div>

        <form className="mt-6 grid gap-4 md:grid-cols-4" onSubmit={handleSearch}>
          <Input
            label="Cari Dokumen"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Nomor, supplier, transaksi"
          />
          <Input
            label="Jenis Dokumen"
            as="select"
            value={filters.document_type}
            onChange={(event) => setFilters((prev) => ({ ...prev, document_type: event.target.value }))}
          >
            <option value="">Semua jenis</option>
            <option value="GRN">GRN / Nota Intern</option>
            <option value="SURAT_JALAN">Surat Jalan</option>
            <option value="FAKTUR">Faktur Pembelian</option>
          </Input>
          <Input
            label="Status"
            as="select"
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          >
            <option value="">Semua status</option>
            <option value="Selesai">Selesai</option>
            <option value="Diterima">Diterima</option>
            <option value="Tercatat">Tercatat</option>
          </Input>
          <div className="flex items-end gap-3">
            <Button type="submit">Filter</Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setFilters(initialFilters);
                setQuery(initialFilters);
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            {errorMessage}
          </div>
        ) : null}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h4 className="text-xl font-bold text-ink">Daftar Dokumen</h4>
            <p className="text-sm text-muted">Dokumen formal yang terhubung dengan transaksi barang masuk.</p>
          </div>
          <Badge tone="muted">Halaman {pagination.current_page} / {pagination.last_page}</Badge>
        </div>
        <Table columns={columns} data={documents} loading={loading} emptyMessage="Belum ada dokumen digital." pagination={false} />
        <div className="mt-5">
          <Pagination
            currentPage={pagination.current_page}
            totalPages={pagination.last_page}
            totalItems={pagination.total}
            pageSize={query.per_page || 15}
            onChange={changePage}
          />
        </div>
      </Card>
    </div>
  );
}
