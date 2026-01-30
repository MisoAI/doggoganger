export class Utils {

  constructor(lorem) {
    this._prng = lorem._prng;
  }

  uuid() {
    return this._prng.uuid();
  }

  randomInt(min, max) {
    return this._prng.randomInt(min, max);
  }

  repeat(fn, range) {
    const n = this._prng.randomInt(...range);
    const result = [];
    for (let i = 0; i < n; i++) {
      result.push(fn());
    }
    return result;
  }

  id() {
    // Generate a base-36 string using PRNG
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += this._prng.randomInt(0, 35).toString(36);
    }
    return result;
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this._prng.randomInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  imageUrl(size) {
    const seed = this._prng.randomInt(0, 999);
    const sizePath = Array.isArray(size) ? size.length > 1 ? `${size[0]}/${size[1]}` : `${size[0]}` : `${size}`;
    return `https://picsum.photos/seed/${seed}/${sizePath}`;
  }

}

// Pure utility functions (no randomness needed)

export function formatDatetime(timestamp) {
  const str = new Date(timestamp).toISOString();
  return str.endsWith('Z') ? str.slice(0, -1) : str;
}

export function sample(size, sampling) {
  return sampling !== undefined ? Math.ceil(size * sampling) : size;
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
