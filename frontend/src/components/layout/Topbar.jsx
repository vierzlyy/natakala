import { Bell, Menu, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const titles = {
  '/': 'Dashboard Inventaris',
  '/products': 'Manajemen Produk',
  '/suppliers': 'Data Supplier',
  '/categories': 'Kategori Produk',
  '/transactions-in': 'Transaksi Barang Masuk',
  '/transactions-out': 'Transaksi Barang Keluar',
  '/documents': 'Dokumentasi Digital',
  '/stock-opname': 'Stock Opname',
  '/reports': 'Laporan & Ekspor',
  '/settings': 'Pengaturan Sistem',
};

const quickPages = [
  { to: '/', title: 'Dashboard', keywords: 'utama ringkasan statistik inventaris' },
  { to: '/products', title: 'Produk', keywords: 'barang master data stok barcode pakaian' },
  { to: '/products/create', title: 'Tambah Produk', keywords: 'buat produk baru barang barcode' },
  { to: '/suppliers', title: 'Supplier', keywords: 'pemasok vendor master data' },
  { to: '/categories', title: 'Kategori', keywords: 'kategori produk jenis barang' },
  { to: '/transactions-in', title: 'Barang Masuk', keywords: 'transaksi masuk pembelian stok tambah' },
  { to: '/transactions-out', title: 'Barang Keluar', keywords: 'transaksi keluar penjualan stok kurang' },
  { to: '/documents', title: 'Dokumen', keywords: 'surat jalan faktur grn nota arsip' },
  { to: '/stock-opname', title: 'Stock Opname', keywords: 'opname scan barcode stok fisik audit' },
  { to: '/reports', title: 'Laporan', keywords: 'report ekspor pdf excel audit' },
  { to: '/settings', title: 'Pengaturan', keywords: 'setting sistem backup restore barcode ukuran' },
];

export default function Topbar({ onOpenMenu, showMenuButton = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return quickPages.slice(0, 5);
    }

    return quickPages
      .filter((page) => `${page.title} ${page.keywords}`.toLowerCase().includes(normalizedQuery))
      .slice(0, 6);
  }, [query]);

  const openPage = (path) => {
    navigate(path);
    setQuery('');
    setFocused(false);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter' && results[0]) {
      event.preventDefault();
      openPage(results[0].to);
    }

    if (event.key === 'Escape') {
      setFocused(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-line bg-surface p-3 shadow-panel sm:gap-4 sm:rounded-[32px] sm:p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
        {showMenuButton ? (
          <button
            type="button"
            onClick={onOpenMenu}
            className="mt-0.5 inline-flex shrink-0 rounded-xl border border-line bg-white p-2.5 text-ink shadow-sm transition hover:border-primary hover:text-primary sm:mt-1 sm:rounded-2xl sm:p-3"
            aria-label="Buka menu navigasi"
            title="Buka menu navigasi"
          >
            <Menu size={18} />
          </button>
        ) : null}
        <div className="min-w-0">
          <p className="brand-wordmark text-lg font-extrabold leading-none sm:text-xl">NataKala</p>
          <h2 className="mt-1.5 break-words text-xl font-extrabold text-ink sm:mt-2 sm:text-[2rem]">
            {titles[location.pathname] || ''}
          </h2>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 sm:min-w-[260px]">
          <div className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5 focus-within:border-primary sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3">
            <Search size={17} className="text-muted" />
            <input
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted"
              placeholder="Cari cepat halaman..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => window.setTimeout(() => setFocused(false), 120)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          {focused ? (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 min-w-0 overflow-hidden rounded-xl border border-line bg-white shadow-panel sm:left-auto sm:w-full sm:min-w-[260px] sm:rounded-2xl">
              {results.length ? (
                results.map((page) => (
                  <button
                    key={page.to}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => openPage(page.to)}
                    className={[
                      'flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-surface',
                      location.pathname === page.to ? 'font-semibold text-primary' : 'font-medium text-ink',
                    ].join(' ')}
                  >
                    <span>{page.title}</span>
                    <span className="text-xs font-semibold text-muted">{page.to}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-muted">Halaman tidak ditemukan.</div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3">
          <Bell size={17} className="text-warning" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{user?.name || 'Admin'}</p>
            <p className="truncate text-xs text-muted">{user?.email || 'admin@natakala.test'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
