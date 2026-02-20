import { prng } from './prng.js';
import { Words } from './words.js';
import { Markdown } from './markdown.js';
import { Fields } from './fields.js';
import { Code } from './code/index.js';
import { Utils } from './utils.js';
import { randomSeed } from './prng.js';

export function lorem(options) {
  return new Lorem(options);
}

class Lorem {

  constructor({ seed = randomSeed() } = {}) {
    this._seed = seed;
    this._prng = prng({ seed });

    // Initialize in dependency order:
    // utils and words have no dependencies on other classes
    // code depends on utils
    // markdown depends on words, code
    // fields depends on words, markdown
    this.utils = new Utils(this);
    this.words = new Words(this);
    this.code = new Code(this);
    this.markdown = new Markdown(this);
    this.fields = new Fields(this);
  }

  get prng() {
    return this._prng;
  }

  get seed() {
    return this._seed;
  }

}
