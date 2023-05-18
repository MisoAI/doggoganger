export function parseBodyIfNecessary(body) {
  if (typeof body === 'string') {
    return JSON.parse(body);
  }
  return body;
}
