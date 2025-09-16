export function normalizeHash(value) {
  if (value == null) {
    return '';
  }

  const raw = String(value).trim();

  if (!raw) {
    return '';
  }

  const queryMatch = raw.match(/hash=([0-9a-fA-F]{64})/);
  if (queryMatch) {
    return queryMatch[1].toLowerCase();
  }

  const hexMatch = raw.match(/[0-9a-fA-F]{64}/);
  if (hexMatch) {
    return hexMatch[0].toLowerCase();
  }

  return raw.toLowerCase();
}

