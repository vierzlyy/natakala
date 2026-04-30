export function getStockStatus(stock = 0, minimum = 5) {
  if (Number(stock) <= 0) {
    return {
      label: 'Habis',
      tone: 'danger',
      className: 'bg-danger/15 text-danger',
    };
  }

  if (Number(stock) <= Number(minimum)) {
    return {
      label: 'Menipis',
      tone: 'warning',
      className: 'bg-warning/20 text-ink',
    };
  }

  return {
    label: 'Tersedia',
    tone: 'success',
    className: 'bg-success/15 text-success',
  };
}

export default getStockStatus;
