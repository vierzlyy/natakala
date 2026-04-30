import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import { useAuth } from '../context/AuthContext';
import Categories from '../pages/Categories';
import Dashboard from '../pages/Dashboard';
import Documents from '../pages/Documents';
import Login from '../pages/Login';
import ProductDetail from '../pages/ProductDetail';
import ProductForm from '../pages/ProductForm';
import Products from '../pages/Products';
import Reports from '../pages/Reports';
import Settings from '../pages/Settings';
import StockOpname from '../pages/StockOpname';
import Suppliers from '../pages/Suppliers';
import TransactionsIn from '../pages/TransactionsIn';
import TransactionsOut from '../pages/TransactionsOut';

function ScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="rounded-3xl border border-line bg-surface px-6 py-4 text-sm font-semibold text-muted shadow-panel">
        Memuat aplikasi...
      </div>
    </div>
  );
}

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <ScreenLoader />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function GuestRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <ScreenLoader />;
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/create" element={<ProductForm />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/products/:id/edit" element={<ProductForm />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/transactions-in" element={<TransactionsIn />} />
          <Route path="/transactions-out" element={<TransactionsOut />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/stock-opname" element={<StockOpname />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
