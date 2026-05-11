import Card from '../ui/Card';

export default function StatCard({ title, value, helper, accent = 'primary' }) {
  const valueLength = String(value).length;
  const valueSizeClass =
    valueLength > 24
      ? 'text-base'
      : valueLength > 20
        ? 'text-lg'
        : valueLength > 16
          ? 'text-xl'
          : valueLength > 12
            ? 'text-2xl'
            : 'text-3xl';
  const accentClass = {
    primary: 'from-primary/20 to-primary/5 text-primary',
    success: 'from-success/20 to-success/5 text-success',
    warning: 'from-warning/25 to-warning/5 text-ink',
    danger: 'from-danger/20 to-danger/5 text-danger',
  }[accent];

  return (
    <Card className="overflow-hidden p-5">
      <div className={`min-w-0 rounded-[24px] bg-gradient-to-br ${accentClass} p-5`}>
        <p className="text-sm font-semibold text-muted">{title}</p>
        <p className={`mt-3 max-w-full overflow-hidden whitespace-nowrap font-extrabold leading-tight text-ink ${valueSizeClass}`}>
          {value}
        </p>
        <p className="mt-2 text-sm text-muted">{helper}</p>
      </div>
    </Card>
  );
}
