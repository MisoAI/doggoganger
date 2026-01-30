import { randomInt, gaussRandom, iterateWithLastItemSignal as iterateWithLastItemSignal } from './utils.js';
import DEFAULT_WORDS from './wordbank.js';

export function words({ decorates = [], output = 'string', size, min, max, ...options } = {}) {
  let iterator = limit(size || [min, max])(base(options));
  for (const decorate of decorates) {
    iterator = lookup(decorate)(iterator);
  }
  return lookup(output)(iterator);
}

const FNS = {
  string,
  array,
  title,
  description,
  multiline,
}

function lookup(fn) {
  switch (typeof fn) {
    case 'string':
      return FNS[fn]();
    case 'function':
      return fn;
    case 'object':
      if (Array.isArray(fn)) {
        const [name, options = {}] = fn;
        return FNS[name](options);
      }
  }
  throw new Error(`Unrecognized decorator/output form: ${fn}`);
}

// base //
export function *base({ words = DEFAULT_WORDS, fixedStarts = 0 } = {}) {
  const wordsLength = words.length;
  for (let i = 0; ; i++) {
    yield words[i < fixedStarts ? i : Math.floor(Math.random() * wordsLength)];
  }
}

// output //
export function string({ separator = ' ' } = {}) {
  return iterator => [...iterator].join(separator);
}

export function array() {
  return iterator => [...iterator];
}

export function multiline({
  wordsPerLine = {
    avg: 10,
    std: 3,
    min: 1,
  },
} = {}) {
  return iterator => {
    let slen = gaussMS(wordsPerLine);
    let result = '';
    for (let word of iterator) {
      if (result) {
        if (slen-- === 0) {
          result += '\n';
          slen = gaussMS(wordsPerLine);
        } else {
          result += ' ';
        }
      }
      result += word;
    }
    return result;
  }
}

// decorators //
export function limit(size = [5, 10]) {
  const n = typeof size === 'number' ? size : randomInt(...size);
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

export function title({} = {}) {
  return function *(iterator) {
    for (let word of iterator) {
      yield capitalize(word);
    }
  };
}

export function description({
  wordsPerSentence = {
    avg: 24,
    std: 5,
    min: 1,
  },
  punctuation = '.',
} = {}) {
  return function *(iterator) {
    let slen = 0;

    yield* iterateWithLastItemSignal(iterator, function *(word, last) {
      if (slen === 0) {
        word = capitalize(word);
        slen = gaussMS(wordsPerSentence);
      }
      if (--slen === 0 || last) {
        word += punctuation;
      }
      yield word;
    });
  };
}

// helpers //
function capitalize(word) {
  return word[0].toUpperCase() + word.substring(1);
}

// TODO: have a random variable expression
function gaussMS(args) {
  if (typeof args === 'number') {
    return Math.round(avg);
  }
  let { avg, std, min, max } = args;
  if (std === undefined) {
    std = avg / 4;
  }
  let n = gaussRandom() * std + avg;
  if (min !== undefined) {
    n = Math.max(min, n);
  }
  if (max !== undefined) {
    n = Math.min(max, n);
  }
  return Math.round(n);
}
