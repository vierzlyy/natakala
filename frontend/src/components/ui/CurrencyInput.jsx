import CurrencyInputField from 'react-currency-input-field';
import clsx from 'clsx';

export default function CurrencyInput({
  label,
  error,
  className = '',
  containerClassName = '',
  onChange,
  ...props
}) {
  return (
    <label className={clsx('block space-y-2', containerClassName)}>
      {label ? <span className="text-sm font-semibold text-text">{label}</span> : null}
      <CurrencyInputField
        className={clsx(
          'w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-primary',
          className,
        )}
        groupSeparator="."
        decimalSeparator=","
        prefix="Rp "
        onValueChange={(value, name, values) => {
          if (onChange) {
            onChange({ target: { name: props.name || name, value: value || '' } });
          }
        }}
        {...props}
      />
      {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
    </label>
  );
}
