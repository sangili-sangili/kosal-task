/**
 * Formats a number to Indian Rupee standard (₹ 1,42,00,000)
 */
export function formatINR(amount) {
  if (amount === undefined || amount === null) return '—';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '—';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formats a number to compact Indian notation (₹1.42 Cr or ₹85 L)
 */
export function formatINRCompact(amount) {
  if (!amount && amount !== 0) return '—';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '—';

  if (num >= 10000000) {
    const cr = (num / 10000000).toFixed(2);
    return `₹${cr.replace(/\.00$/, '')} Cr`;
  }
  if (num >= 100000) {
    const l = (num / 100000).toFixed(2);
    return `₹${l.replace(/\.00$/, '')} L`;
  }
  return formatINR(num);
}

/**
 * Standard date formatter
 */
export function formatCRMDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Time elapsed formatter (e.g. "Today, 10:30 AM" or "Yesterday, 4:00 PM")
 */
export function formatCRMTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
