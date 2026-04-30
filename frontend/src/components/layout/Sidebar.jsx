import {
  Boxes,
  ChartColumn,
  ClipboardList,
  FileText,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  PackagePlus,
  PackageSearch,
  Settings,
  Shapes,
  Truck,
  Undo2,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const menuGroups = [
  {
    title: 'Utama',
    items: [
      { to: '/', label: 'Dashboard', shortLabel: 'Dash', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Master Data',
    items: [
      { to: '/products', label: 'Produk', shortLabel: 'Produk', icon: Boxes },
      { to: '/suppliers', label: 'Supplier', shortLabel: 'Supp', icon: Truck },
      { to: '/categories', label: 'Kategori', shortLabel: 'Kat', icon: Shapes },
    ]
  },
  {
    title: 'Transaksi',
    items: [
      { to: '/transactions-in', label: 'Barang Masuk', shortLabel: 'Masuk', icon: PackagePlus },
      { to: '/transactions-out', label: 'Barang Keluar', shortLabel: 'Keluar', icon: Undo2 },
    ]
  },
  {
    title: 'Laporan & Audit',
    items: [
      { to: '/documents', label: 'Dokumen', shortLabel: 'Dok', icon: FileText },
      { to: '/stock-opname', label: 'Stock Opname', shortLabel: 'Opname', icon: PackageSearch },
      { to: '/reports', label: 'Laporan', shortLabel: 'Lapor', icon: ChartColumn },
    ]
  },
  {
    title: 'Sistem',
    items: [
      { to: '/settings', label: 'Pengaturan', shortLabel: 'Atur', icon: Settings },
    ]
  }
];

export default function Sidebar({ collapsed = false, narrowMode = false, onToggleCollapse, onCloseMobile }) {
  const { logout } = useAuth();

  return (
    <aside
      className={[
        'z-40 flex h-full flex-col rounded-[32px] border border-line bg-surface p-5 shadow-panel transition-all duration-300',
        collapsed ? 'w-full max-w-[132px]' : 'w-full max-w-[290px]',
        narrowMode ? 'sticky top-4 self-start' : 'lg:sticky lg:top-6',
      ].join(' ')}
    >
      <div className={collapsed ? 'p-2' : 'px-2 pb-4 pt-3'}>
        <div className={collapsed ? 'flex flex-col items-center gap-2' : 'flex items-center justify-between gap-3'}>
          <h1 className={['brand-wordmark font-extrabold leading-none', collapsed ? 'text-xl' : 'text-[34px]'].join(' ')}>
            NataKala
          </h1>
          <div className={collapsed ? 'flex flex-col items-center gap-2' : 'flex items-center gap-2'}>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="inline-flex rounded-xl p-2 text-muted transition hover:bg-white hover:text-ink"
              aria-label={collapsed ? 'Buka sidebar' : 'Lipat sidebar'}
              title={collapsed ? 'Buka sidebar' : 'Lipat sidebar'}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
        </div>
      </div>

      <nav className="mt-6 flex-1 space-y-4">
        {menuGroups.map((group, index) => (
          <div key={index} className="space-y-1">
            {!collapsed && (
              <h3 className="mb-2 px-4 text-[10px] font-bold uppercase tracking-wider text-muted">
                {group.title}
              </h3>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (narrowMode && !collapsed) {
                      onCloseMobile?.();
                    }
                  }}
                  className={({ isActive }) =>
                    [
                      'rounded-2xl px-4 py-3 text-sm font-semibold transition',
                      collapsed ? 'flex flex-col items-center justify-center gap-2 px-2 text-center' : 'flex items-center gap-3',
                      isActive ? 'bg-primary text-white shadow-panel' : 'text-muted hover:bg-white hover:text-ink',
                    ].join(' ')
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} />
                  {collapsed ? (
                    <span className="text-[11px] font-semibold leading-tight">{item.shortLabel}</span>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <button
        type="button"
        onClick={logout}
        className={[
          'mt-6 flex rounded-2xl bg-danger py-3 text-sm font-semibold text-white transition hover:bg-danger/90',
          collapsed ? 'flex-col items-center justify-center gap-2 px-2 text-center' : 'items-center gap-3 px-4',
        ].join(' ')}
        title={collapsed ? 'Logout' : undefined}
      >
        <LogOut size={18} />
        {collapsed ? <span className="text-[11px] leading-tight">Keluar</span> : 'Logout'}
      </button>

      <div
        className={[
          'mt-4 rounded-2xl border border-line bg-white py-3',
          collapsed ? 'flex flex-col items-center justify-center gap-2 px-2 text-center' : 'flex items-center gap-3 px-4',
        ].join(' ')}
        title={collapsed ? 'Admin Only' : undefined}
      >
        <ClipboardList size={18} className="text-primary" />
        {collapsed ? (
          <div>
            <p className="text-[11px] font-semibold leading-tight text-ink">Admin</p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-ink">Admin Only</p>
            <p className="text-xs text-muted">Akses penuh CRUD inventaris</p>
          </div>
        )}
      </div>
    </aside>
  );
}
