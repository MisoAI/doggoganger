export class Utils {

  constructor(lorem) {
    this._prng = lorem._prng;
  }

  repeat(fn, range) {
    const n = this._prng.randomInt(...range);
    const result = [];
    for (let i = 0; i < n; i++) {
      result.push(typeof fn === 'function' ? fn() : fn);
    }
    return result;
  }

  shuffle(array) {
    return this.select(array);
  }

  selectOne(array) {
    return array[this._prng.randomInt(0, array.length - 1)];
  }

  select(array, n) {
    if (n === 1) {
      return [this.selectOne(array)];
    }
    const copy = [...array];
    const len = copy.length;
    if (n === undefined) {
      n = len;
    }
    if (n < 0) {
      throw new Error('n must be non-negative');
    }
    n = Math.min(n, len);
    for (let i = 0; i < n; i++) {
      const j = this._prng.randomInt(i, len - 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
  }

  imageUrl(size) {
    const seed = this._prng.randomInt(0, 999);
    const sizePath = Array.isArray(size) ? size.length > 1 ? `${size[0]}/${size[1]}` : `${size[0]}` : `${size}`;
    return `https://picsum.photos/seed/${seed}/${sizePath}`;
  }

}
