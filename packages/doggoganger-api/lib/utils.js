export function trimObj(obj) {
  if (typeof obj !== 'object') {
    return obj;
  }
  const trimmed = {};
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined) {
      trimmed[k] = obj[k];
    }
  }
  return trimmed;
}

// The fixed clock all generated answers are dated from, so mock data stays
// reproducible across runs.
export const BASE_TIMESTAMP = Date.UTC(2026, 0, 1);

export function formatDatetime(timestamp) {
  const str = new Date(timestamp).toISOString();
  return str.endsWith('Z') ? str.slice(0, -1) : str;
}

export function sample(size, sampling) {
  return sampling !== undefined ? Math.ceil(size * sampling) : size;
}

export function excludeHtml({ html, ...rest }) {
  return rest;
}
