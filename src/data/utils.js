export function uuid() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, a => (a ^ Math.random() * 16 >> a / 4).toString(16));
}

export function randomInt(min, max) {
  return max == null || (max <= min) ? min : (min + Math.floor(Math.random() * (max - min + 1)));
}

// TODO: pass in size
export function repeat(fn, range) {
  const n = randomInt(...range);
  const result = [];
  for (let i = 0; i < n; i++) {
    result.push(fn());
  }
  return result;
}

export function id() {
  return Math.random().toString(36).substring(2, 10);
}

export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function imageUrl(size) {
  const seed = Math.floor(Math.random() * 1000);
  const sizePath = Array.isArray(size) ? size.length > 1 ? `${size[0]}/${size[1]}` : `${size[0]}` : `${size}`;
  return `https://picsum.photos/seed/${seed}/${sizePath}`;
}

export function formatDatetime(timestamp) {
  const str = new Date(timestamp).toISOString();
  return str.endsWith('Z') ? str.slice(0, -1) : str;
}

export function sample(size, sampling) {
  return sampling !== undefined ? Math.ceil(size * sampling) : size;
}

export function gaussRandom() {
  return uniformRandom() + uniformRandom() + uniformRandom();
}

export function rollLatency(min, max) {
  return (min + max) / 2 + gaussRandom() * (max - min) / 6;
}

function uniformRandom() {
  return Math.random() * 2 - 1;
}

export function *iterateWithLastItemSignal(iterator, fn) {
  let last;
  for (const item of iterator) {
    if (last) {
      yield* fn(last);
    }
    last = item;
  }
  if (last) {
    yield* fn(last, true);
  }
}

export function excludeHtml({ html, ...rest }) {
  return rest;
}
