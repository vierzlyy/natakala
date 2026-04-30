import { Bell, Search } from 'lucide-react';
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

export default function Topbar() {
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
    <div className="flex flex-col gap-4 rounded-[32px] border border-line bg-surface p-5 shadow-panel lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3">
        <div>
          <p className="brand-wordmark text-xl font-extrabold leading-none">NataKala</p>
          <h2 className="mt-2 text-[2rem] font-extrabold tracking-[-0.04em] text-ink">
            {titles[location.pathname] || ''}
          </h2>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 focus-within:border-primary">
            <Search size={18} className="text-muted" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted sm:w-52"
              placeholder="Cari cepat halaman..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => window.setTimeout(() => setFocused(false), 120)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          {focused ? (
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-full min-w-[260px] overflow-hidden rounded-2xl border border-line bg-white shadow-panel">
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

        <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3">
          <Bell size={18} className="text-warning" />
          <div>
            <p className="text-sm font-semibold text-ink">{user?.name || 'Admin'}</p>
            <p className="text-xs text-muted">{user?.email || 'admin@natakala.test'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
