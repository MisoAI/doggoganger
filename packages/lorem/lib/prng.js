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

  randomInt(min, max) {
    return max == null || (max <= min) ? min : (min + Math.floor(this.random() * (max - min + 1)));
  }

  randomGauss() {
    return (this.random() + this.random() + this.random()) * 2 - 3;
  }

  uuid() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, a => (a ^ this.random() * 16 >> a / 4).toString(16));
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

function randomSeed() {
  return Math.random() * 0x100000000 >>> 0;
}

function toXoshiro128State(seed = 1) {
  if (Array.isArray(seed) && seed.length === 4) {
    return [...seed];
  }
  const gen = splitMix32(seed);
  return [gen(), gen(), gen(), gen()];
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
