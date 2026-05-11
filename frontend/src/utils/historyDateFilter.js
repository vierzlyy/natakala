export const historyMonthOptions = [
  ['01', 'Januari'],
  ['02', 'Februari'],
  ['03', 'Maret'],
  ['04', 'April'],
  ['05', 'Mei'],
  ['06', 'Juni'],
  ['07', 'Juli'],
  ['08', 'Agustus'],
  ['09', 'September'],
  ['10', 'Oktober'],
  ['11', 'November'],
  ['12', 'Desember'],
];

export function createHistoryFilter() {
  const today = new Date();

  return {
    mode: 'all',
    date: '',
    month: String(today.getMonth() + 1).padStart(2, '0'),
    year: String(today.getFullYear()),
  };
}

export function historyYearOptions(length = 12) {
  const currentYear = new Date().getFullYear();

  return Array.from({ length }, (_, index) => String(currentYear + 1 - index));
}

export function monthName(month) {
  return historyMonthOptions.find(([value]) => value === String(month).padStart(2, '0'))?.[1] || 'Bulan';
}

function normalizeDate(value) {
  return String(value || '').slice(0, 10);
}

function dateGroupLabel(date) {
  if (!date) return 'Tanggal tidak tersimpan';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

export function historyFilterLabel(filter) {
  if (filter.mode === 'date') {
    return filter.date ? `Tanggal ${dateGroupLabel(filter.date)}` : 'Dikelompokkan per tanggal';
  }

  if (filter.mode === 'month') {
    return `${monthName(filter.month)} ${filter.year}`;
  }

  return 'Semua riwayat';
}

export function applyHistoryDateFilter(rows = [], filter = createHistoryFilter()) {
  return rows
    .filter((row) => {
      const date = normalizeDate(row.date);

      if (filter.mode === 'date' && filter.date) {
        return date === filter.date;
      }

      if (filter.mode === 'month') {
        return date.slice(0, 7) === `${filter.year}-${String(filter.month).padStart(2, '0')}`;
      }

      return true;
    })
    .map((row) => {
      const date = normalizeDate(row.date);
      const rowMonth = date.slice(5, 7);
      const rowYear = date.slice(0, 4);

      return {
        ...row,
        group_label: filter.mode === 'month' ? `${monthName(rowMonth)} ${rowYear}` : dateGroupLabel(date),
      };
    });
}
