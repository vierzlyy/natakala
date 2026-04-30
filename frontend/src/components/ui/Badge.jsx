import clsx from 'clsx';

const tones = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/25 text-ink',
  danger: 'bg-danger/15 text-danger',
  primary: 'bg-primary/15 text-primary',
  muted: 'bg-white/70 text-muted',
};

export default function Badge({ children, tone = 'muted', className = '' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
