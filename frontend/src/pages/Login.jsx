import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/serviceUtils';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.email.trim()) nextErrors.email = 'Email wajib diisi.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Format email belum valid.';
    }
    if (!form.password) nextErrors.password = 'Password wajib diisi.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      await login({ email: form.email.trim(), password: form.password });
      toast.success('Login berhasil.');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Login gagal.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-scene relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="login-blob login-blob-peach" />
      <div className="login-blob login-blob-gold" />
      <div className="login-blob login-blob-blue" />
      <div className="login-blob login-blob-green" />
      <div className="login-dots login-dots-top" />
      <div className="login-dots login-dots-bottom" />
      <div className="login-waves" />

      <div className="relative z-10 w-full max-w-[720px]">
        <div className="login-shell rounded-[36px] border border-line bg-white/90 p-8 shadow-[0_28px_80px_rgba(43,43,43,0.12)] backdrop-blur-sm sm:p-10 lg:p-14">
          <div className="text-center">
            <h1 className="login-brand text-5xl font-black tracking-[-0.08em] sm:text-6xl">NataKala</h1>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-primary">
              <ShieldCheck size={18} />
              Admin Access
            </div>
            <h2 className="mt-7 text-4xl font-extrabold tracking-[-0.05em] text-ink sm:text-5xl">Masuk ke Dashboard</h2>
            <p className="mt-4 text-lg text-muted">Selamat datang kembali, Admin.</p>
          </div>

          <form className="mt-10 space-y-7" onSubmit={handleSubmit}>
            <label className="block space-y-3">
              <span className="text-sm font-bold text-ink">Email</span>
              <div className="flex items-center gap-4 rounded-[22px] border border-line bg-white px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition focus-within:border-primary">
                <Mail size={24} className="shrink-0 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  placeholder="admin@natakala.test"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border-0 bg-transparent text-lg text-ink outline-none placeholder:text-slate-400"
                />
              </div>
              {errors.email ? <p className="text-xs font-medium text-danger">{errors.email}</p> : null}
            </label>

            <label className="block space-y-3">
              <span className="text-sm font-bold text-ink">Password</span>
              <div className="flex items-center gap-4 rounded-[22px] border border-line bg-white px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition focus-within:border-primary">
                <Lock size={24} className="shrink-0 text-slate-400" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full border-0 bg-transparent text-lg text-ink outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="shrink-0 rounded-full p-1 text-slate-400 transition hover:text-primary"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
              {errors.password ? <p className="text-xs font-medium text-danger">{errors.password}</p> : null}
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-[22px] bg-primary px-6 py-5 text-xl font-bold text-white shadow-[0_16px_30px_rgba(77,150,255,0.32)] transition hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span>{loading ? 'Memproses...' : 'Login Sebagai Admin'}</span>
              {!loading ? <ArrowRight size={24} /> : null}
            </button>
          </form>
        </div>

        <p className="mt-10 text-center text-sm font-medium text-muted">© 2025 NataKala. Semua hak dilindungi.</p>
      </div>
    </div>
  );
}
