import DEFAULT_WORDS from './wordbank.js';

export class Words {

  constructor(lorem) {
    this._prng = lorem._prng;
  }

  words({ decorates = [], output = 'string', size, min, max, ...options } = {}) {
    let iterator = this.limit(size || [min, max])(this.base(options));
    for (const decorate of decorates) {
      iterator = this._lookup(decorate)(iterator);
    }
    return this._lookup(output)(iterator);
  }

  _lookup(fn) {
    switch (typeof fn) {
      case 'string':
        return this._fns[fn]();
      case 'function':
        return fn;
      case 'object':
        if (Array.isArray(fn)) {
          const [name, options = {}] = fn;
          return this._fns[name](options);
        }
    }
    throw new Error(`Unrecognized decorator/output form: ${fn}`);
  }

  get _fns() {
    return {
      string: (options) => this.string(options),
      array: (options) => this.array(options),
      title: (options) => this.title(options),
      description: (options) => this.description(options),
      multiline: (options) => this.multiline(options),
    };
  }

  // base //
  *base({ words = DEFAULT_WORDS, fixedStarts = 0 } = {}) {
    const wordsLength = words.length;
    for (let i = 0; ; i++) {
      yield words[i < fixedStarts ? i : this._prng.randomInt(0, wordsLength - 1)];
    }
  }

  // output //
  string({ separator = ' ' } = {}) {
    return iterator => [...iterator].join(separator);
  }

  array() {
    return iterator => [...iterator];
  }

  multiline({
    wordsPerLine = {
      avg: 10,
      std: 3,
      min: 1,
    },
  } = {}) {
    return iterator => {
      let slen = this._gaussMS(wordsPerLine);
      let result = '';
      for (let word of iterator) {
        if (result) {
          if (slen-- === 0) {
            result += '\n';
            slen = this._gaussMS(wordsPerLine);
          } else {
            result += ' ';
          }
        }
        result += word;
      }
      return result;
    };
  }

  // decorators //
  limit(size = [5, 10]) {
    const n = typeof size === 'number' ? size : this._prng.randomInt(...size);
    const self = this;
    return function *(iterator) {
      let i = 0;
      for (let word of iterator) {
        if (i++ >= n) {
          break;
        }
        yield word;
      }
    };
  }

  title({} = {}) {
    return function *(iterator) {
      for (let word of iterator) {
        yield capitalize(word);
      }
    };
  }

  description({
    wordsPerSentence = {
      avg: 24,
      std: 5,
      min: 1,
    },
    punctuation = '.',
  } = {}) {
    const self = this;
    return function *(iterator) {
      let slen = 0;

      yield* iterateWithLastItemSignal(iterator, function *(word, last) {
        if (slen === 0) {
          word = capitalize(word);
          slen = self._gaussMS(wordsPerSentence);
        }
        if (--slen === 0 || last) {
          word += punctuation;
        }
        yield word;
      });
    };
  }

  // helpers //
  _gaussMS(args) {
    if (typeof args === 'number') {
      return Math.round(args);
    }
    let { avg, std, min, max } = args;
    if (std === undefined) {
      std = avg / 4;
    }
    let n = this._prng.randomGauss() * std + avg;
    if (min !== undefined) {
      n = Math.max(min, n);
    }
    if (max !== undefined) {
      n = Math.min(max, n);
    }
    return Math.round(n);
  }

}

// helpers //
function capitalize(word) {
  return word[0].toUpperCase() + word.substring(1);
}

function *iterateWithLastItemSignal(iterator, fn) {
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
