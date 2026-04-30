import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import StatCard from '../components/dashboard/StatCard';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import dashboardService from '../services/dashboardService';
import formatCurrency from '../utils/formatCurrency';
import { formatProductColor, formatSizeStockSummary } from '../utils/productVariant';
import getStockStatus from '../utils/stockStatus';

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const response = await dashboardService.get();
        setDashboard(response);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = dashboard?.summary || dashboard || {};
  const lowStockProducts = dashboard?.low_stock_products || [];
  const chartData = dashboard?.transaction_chart || [];

  const lowStockColumns = [
    { key: 'sku', title: 'SKU' },
    { key: 'name', title: 'Produk' },
    {
      key: 'stock',
      title: 'Status',
      render: (row) => {
        const status = getStockStatus(row.stock, row.minimum_stock);
        return (
          <div className="space-y-1">
            <Badge tone={status.tone}>{`${row.stock} pcs - ${status.label}`}</Badge>
            <p className="text-xs text-muted">Ukuran: {formatSizeStockSummary(row)}</p>
            <p className="text-xs text-muted">Warna: {formatProductColor(row)}</p>
          </div>
        );
      },
    },
    { key: 'supplier_name', title: 'Supplier' },
    { key: 'storage_location', title: 'Lokasi' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Produk" value={stats.total_products || 0} helper="Seluruh SKU aktif di gudang" accent="primary" />
        <StatCard title="Total Stok" value={stats.total_stock || 0} helper="Akumulasi item tersedia" accent="success" />
        <StatCard
          title="Nilai Inventaris"
          value={formatCurrency(stats.inventory_value || 0, stats.currency || 'IDR')}
          helper="Estimasi dari stok x harga beli"
          accent="warning"
        />
        <StatCard title="Barang Habis" value={stats.out_of_stock || 0} helper="Produk perlu restock" accent="danger" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-ink">Grafik Transaksi</h3>
              <p className="text-sm text-muted">Perbandingan barang masuk dan keluar.</p>
            </div>
            <Badge tone="primary">Realtime</Badge>
          </div>

          <div className="h-[320px]">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted">Memuat grafik...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D6D3CE" />
                  <XAxis dataKey="label" stroke="#6B6B6B" />
                  <YAxis stroke="#6B6B6B" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="in" name="Barang Masuk" fill="#4D96FF" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="out" name="Barang Keluar" fill="#FFD93D" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-bold text-ink">Ringkasan Cepat</h3>
          <div className="mt-5 space-y-4">
            <div className="rounded-[24px] bg-white p-4">
              <p className="text-sm text-muted">Stok menipis</p>
              <p className="mt-1 text-2xl font-bold text-ink">{stats.low_stock || 0} produk</p>
            </div>
            <div className="rounded-[24px] bg-white p-4">
              <p className="text-sm text-muted">Produk paling laku</p>
              <p className="mt-1 text-xl font-bold text-ink">{dashboard?.best_seller?.name || '-'}</p>
              <p className="mt-1 text-sm text-muted">{dashboard?.best_seller?.total_sold || 0} item terjual</p>
            </div>
            <div className="rounded-[24px] bg-white p-4">
              <p className="text-sm text-muted">Produk stok habis</p>
              <p className="mt-1 text-2xl font-bold text-danger">{stats.out_of_stock || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-5">
          <h3 className="text-xl font-bold text-ink">Produk Stok Menipis</h3>
          <p className="text-sm text-muted">Prioritas restock untuk mencegah kehabisan stok.</p>
        </div>
        <Table columns={lowStockColumns} data={lowStockProducts} loading={loading} emptyMessage="Tidak ada produk menipis." />
      </Card>
    </div>
  );
}
