import ReactSelect from 'react-select';
import clsx from 'clsx';

export default function SearchableSelect({
  label,
  error,
  containerClassName = '',
  options = [],
  value,
  onChange,
  placeholder = 'Pilih...',
  ...props
}) {
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '1rem',
      borderColor: state.isFocused ? '#3B82F6' : '#E5E7EB',
      boxShadow: state.isFocused ? '0 0 0 1px #3B82F6' : 'none',
      padding: '0.15rem 0.5rem',
      backgroundColor: '#ffffff',
      fontSize: '0.875rem',
      minHeight: '46px',
      '&:hover': {
        borderColor: state.isFocused ? '#3B82F6' : '#E5E7EB',
      }
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 0.5rem',
    }),
    input: (provided) => ({
      ...provided,
      margin: 0,
      padding: 0,
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '1rem',
      overflow: 'hidden',
      zIndex: 50,
      fontSize: '0.875rem',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EBF5FF' : '#ffffff',
      color: state.isSelected ? '#ffffff' : '#1F2937',
      cursor: 'pointer',
      padding: '10px 16px',
    }),
  };

  const selectedOption = options.find(opt => String(opt.value) === String(value)) || null;

  const handleChange = (selected) => {
    if (onChange) {
      onChange({ target: { name: props.name, value: selected ? selected.value : '' } });
    }
  };

  return (
    <label className={clsx('block space-y-2', containerClassName)}>
      {label ? <span className="text-sm font-semibold text-text">{label}</span> : null}
      <ReactSelect
        styles={customStyles}
        options={options}
        value={selectedOption}
        onChange={handleChange}
        placeholder={placeholder}
        isClearable
        {...props}
      />
      {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
    </label>
  );
}
