export function formatDate(date) {
  if (!date) {
    return '—';
  }

  try {
    const parsed = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(parsed);
  } catch (error) {
    console.warn('Erreur de formatage de date:', error);
    return '—';
  }
}

export function displayValue(value) {
  if (!value) {
    return '—';
  }
  return value;
}
