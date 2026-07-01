export function prng({ seed = randomSeed() } = {}) {
  return new PRNG(new Xoshiro128(toXoshiro128State(seed)));
}

class PRNG {

  constructor(engine) {
    this._engine = engine;
  }

  random() {
    return this._engine.next() / 0x100000000;
  }

  randomBool(probability = 0.5) {
    return this.random() < probability;
  }

  randomInt(min, max) {
    return max == null || (max <= min) ? min : (min + Math.floor(this.random() * (max - min + 1)));
  }

  randomGauss() {
    return (this.random() + this.random() + this.random()) * 2 - 3;
  }

  seed() {
    return this.random() * 0x100000000 >>> 0;
  }

  uuid() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, a => (a ^ this.random() * 16 >> a / 4).toString(16));
  }

  shortId() {
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += this.randomInt(0, 35).toString(36);
    }
    return result;
  }

}

function splitMix32(seed) {
  let x = seed >>> 0;
  return () => {
    x += 0x9e3779b9;
    let z = x;
    z = (z ^ (z >>> 16)) >>> 0;
    z = Math.imul(z, 0x85ebca6b) >>> 0;
    z = (z ^ (z >>> 13)) >>> 0;
    z = Math.imul(z, 0xc2b2ae35) >>> 0;
    return (z ^ (z >>> 16)) >>> 0;
  };
}

// rotate left 32-bit
function rotl(x, k) {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

export function randomSeed() {
  return Math.random() * 0x100000000 >>> 0;
}

function toXoshiro128State(seed = 1) {
  if (Array.isArray(seed) && seed.length === 4) {
    return [...seed];
  }
  if (typeof seed === 'string') {
    seed = hashString(seed);
  }
  const gen = splitMix32(seed);
  return [gen(), gen(), gen(), gen()];
}

// FNV-1a 32-bit hash, used to derive a numeric seed from a string.
function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

class Xoshiro128 {

  constructor(state) {
    this._state = state;
  }

  get state() {
    return [...this._state];
  }

  next() {
    const state = this._state;

    const value = rotl(state[1] * 5 >>> 0, 7) * 9 >>> 0;
    
    const t = state[1] << 9 >>> 0;
    state[2] ^= state[0];
    state[3] ^= state[1];
    state[1] ^= state[2];
    state[0] ^= state[3];
    state[2] ^= t;
    state[3] = rotl(state[3], 11);

    return value;
  }

}
