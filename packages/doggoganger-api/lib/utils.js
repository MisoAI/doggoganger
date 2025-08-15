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
