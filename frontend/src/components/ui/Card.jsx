import clsx from 'clsx';

export default function Card({ children, className = '' }) {
  return (
    <div className={clsx('rounded-[28px] border border-line bg-surface shadow-panel', className)}>
      {children}
    </div>
  );
}
