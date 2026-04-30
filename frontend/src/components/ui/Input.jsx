import clsx from 'clsx';

export default function Input({
  label,
  error,
  as = 'input',
  className = '',
  containerClassName = '',
  ...props
}) {
  const Component = as;

  return (
    <label className={clsx('block space-y-2', containerClassName)}>
      {label ? <span className="text-sm font-semibold text-text">{label}</span> : null}
      <Component
        className={clsx(
          'w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-primary',
          as === 'textarea' ? 'min-h-[120px] resize-y' : '',
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
    </label>
  );
}
