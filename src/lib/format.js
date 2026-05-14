export const TZ = 'America/Sao_Paulo';
export const LOCALE = 'pt-BR';

export function formatDateTime(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(LOCALE, {
    timeZone: TZ,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDate(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, dd] = value.split('-');
    return `${dd}/${m}/${y}`;
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(LOCALE, {
    timeZone: TZ,
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export function formatNumber(value, decimals = 2) {
  const n = Number(value);
  if (Number.isNaN(n)) return '-';
  return n.toLocaleString(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatInt(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return '-';
  return n.toLocaleString(LOCALE);
}

export function timestampPtBR() {
  return new Date().toLocaleString(LOCALE, { timeZone: TZ, hour12: false });
}

export function formatDuracao(min) {
  if (min == null || min === '') return '-';
  const n = Math.round(Number(min));
  if (Number.isNaN(n)) return '-';
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
