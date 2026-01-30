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
