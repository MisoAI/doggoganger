export class Utils {

  constructor(lorem) {
    this._prng = lorem._prng;
  }

  repeat(fn, range) {
    const n = this._prng.randomInt(...range);
    const result = [];
    for (let i = 0; i < n; i++) {
      result.push(fn());
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
