import Card from '../ui/Card';

export default function StatCard({ title, value, helper, accent = 'primary' }) {
  const valueLength = String(value).length;
  const valueSizeClass =
    valueLength > 24
      ? 'text-[clamp(0.78rem,3vw,0.95rem)]'
      : valueLength > 20
        ? 'text-[clamp(0.84rem,3.2vw,1.05rem)]'
        : valueLength > 16
          ? 'text-[clamp(0.95rem,3.5vw,1.18rem)]'
          : valueLength > 12
            ? 'text-[clamp(1.02rem,3.8vw,1.35rem)]'
            : 'text-[clamp(1.28rem,5vw,1.75rem)] sm:text-3xl';
  const accentClass = {
    primary: 'from-primary/20 to-primary/5 text-primary',
    success: 'from-success/20 to-success/5 text-success',
    warning: 'from-warning/25 to-warning/5 text-ink',
    danger: 'from-danger/20 to-danger/5 text-danger',
  }[accent];

  return (
    <Card className="overflow-hidden p-5">
      <div className={`min-w-0 rounded-[24px] bg-gradient-to-br ${accentClass} p-4 sm:p-5`}>
        <p className="text-sm font-semibold text-muted">{title}</p>
        <p className={`mt-3 block min-w-0 max-w-full whitespace-nowrap font-extrabold leading-tight text-ink ${valueSizeClass}`}>
          {value}
        </p>
        <p className="mt-2 text-sm text-muted">{helper}</p>
      </div>
    </Card>
  );
}
