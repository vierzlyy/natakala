import clsx from 'clsx';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary/90',
  secondary: 'bg-surface text-text hover:bg-white',
  danger: 'bg-danger text-white hover:bg-danger/90',
  ghost: 'bg-transparent text-muted hover:bg-white',
  warning: 'bg-warning text-ink hover:bg-warning/90',
};

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  loading = false,
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading ? 'Memproses...' : children}
    </button>
  );
}
