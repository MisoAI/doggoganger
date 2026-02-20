import * as languages from './languages.js';

// TODO: emoji

const FEATURES = [
  ['paragraph', 5],
  ['heading', 2],
  ['list', 2],
  ['table', 2],
  ['hr', 1],
  ['blockQuote', 1],
  ['codeBlock', 1],
  ['rawHtml', 1],
  ['image', 1],
];

const WEIGHTED_FEATURES = FEATURES.reduce((acc, [feature, weight]) => {
  for (let i = 0; i < weight; i++) {
    acc.push(feature);
  }
  return acc;
}, []);

export class Markdown {

  constructor(lorem) {
    this._lorem = lorem;
    this._prng = lorem._prng;
    this._words = lorem.words;
    this._code = lorem.code;
  }

  // TODO: wild mode that generates edge cases

  _extractLangFeatures(features = []) {
    const languages = new Set();
    const rest = [];
    for (const feature of features) {
      if (feature.startsWith('lang-')) {
        let lang = feature.slice(5);
        if (lang === 'javascript') {
          lang = 'js';
        }
        languages.add(lang);
      } else {
        rest.push(feature);
      }
    }
    return [[...languages], rest];
  }

  markdown({ features, blocks = [8, 12], ...options } = {}) {
    const { sources, citation } = options;
    const blockCount = this._lorem.prng.randomInt(...blocks);
    const selection = this._lorem.utils.select(WEIGHTED_FEATURES, blockCount);

    let result = selection.map(feature => this[feature](options)).join('\n\n');

    // TODO: block features
    /*
    let langs = [];
    [langs, features] = this._extractLangFeatures(features);
    let result = this._sample([
      () => this.atxHeading({ features }),
      () => this.paragraph({ sources, citation, features }),
      ...langs.map(lang => () => this.fencedCodeBlock({ lang, features })),
      ...(langs.length ? [] : [() => this.fencedCodeBlock({ features })]),
      () => this.paragraph({ sources, citation, features }),
      () => this.table({ features }),
      () => this.image(),
      () => this.paragraph({ sources, citation, features }),
      () => this.hr(),
      () => this.rawHtml(),
      () => this.atxHeading({ features }),
      () => this.paragraph({ sources, citation, features }),
      () => this.list({ features }),
      () => this.paragraph({ sources, citation, features }),
    ], sampling).join('\n\n');
    */

    if (citation && citation.unused && citation.unused.length) {
      // flush all unused citations
      const indicies = [...citation.unused];
      indicies.sort((a, b) => a - b);
      result += indicies.map(index => this._citation(citation, sources[index])).join('');
    }

    return result;
  }

  _sample(fns, sampling) {
    const arr = [];
    for (const fn of fns) {
      if (sampling >= 1 || this._prng.random() < sampling) {
        arr.push(fn());
      }
    }
    return arr;
  }

  // leaf blocks //
  hr() {
    // wild mode: while spaces at the beginning (< 4), in between, in the end
    // wild mode: no line break for '*'
    const c = '*-_'.charAt(this._prng.randomInt(0, 2));
    const len = this._prng.randomInt(3, 6);
    return c.repeat(len);
  }

  heading(options) {
    return this._prng.randomBool(0.75) ? this.atxHeading(options) : this.setextHeading(options);
  }

  atxHeading({ features, level = [1, 6], size = [1, 8], content } = {}) {
    const text = content || this._words.words({ size });
    return `${'#'.repeat(this._prng.randomInt(...level))} ${text}`;
  }

  setextHeading({ features, level = [1, 2], size = [1, 8], content } = {}) {
    const text = content || this._words.words({ size });
    const c = '=-'.charAt(this._prng.randomInt(...level) - 1);
    return `${text}\n${c.repeat(3)}`;
  }

  linkReferenceDefinition({ label, destination, title }) {
    return `[${label}]: ${destination}${title !== undefined ? ` ${title}` : ''}`;
  }

  codeBlock(options) {
    return this._prng.randomBool(0.75) ? this.fencedCodeBlock(options) : this.indentedCodeBlock(options);
  }

  indentedCodeBlock({ lang, content, size }) {
    content = content || this._codeContent({ lang, size });
    return this._indent(4, content);
  }

  fencedCodeBlock({ lang, content, size, fenceChar = '`' } = {}) {
    if (fenceChar === 'random') {
      fenceChar = '`~'.charAt(this._prng.randomInt(0, 1));
    }
    content = content || this._codeContent({ lang, size });
    // TODO: escape fenceChar in content
    return `${fenceChar.repeat(3)}${lang || ''}\n${content}\n${fenceChar.repeat(3)}`;
  }

  paragraph({ sources, citation, features, size = [20, 50] } = {}) {
    // force all inline features
    const decorates = ['description', this.decorateInlineFeatures()];
    if (sources && citation) {
      decorates.push(this.decorateCitation(sources, citation));
    }
    return this._words.words({ size, decorates });
  }

  table({ features, columns = [2, 4], rows = [2, 8] } = {}) {
    const cols = this._prng.randomInt(...columns);
    const rowCount = this._prng.randomInt(...rows);
    const defs = [...this._multiply({ size: 1 }, cols - 1), { size: [3, 8] }];
    const header = this._words.words({ size: cols, output: 'array' });
    const delimiter = defs.map(() => '---');
    const body = [header, delimiter];
    for (let i = 0; i < rowCount - 1; i++) {
      body.push(defs.map(({ size }) => this._words.words({ size })));
    }
    return body.map(this._tableRow).join('\n');
  }

  image({ url, imageSize = [400, 250], ...options } = {}) {
    url = url || this._imageUrl(imageSize);
    return `![${this._content(options)}](${url})`;
  }

  // container blocks //
  blockQuote({ features, size = [3, 5] } = {}) {
    // TODO
    return this._blockQuote(this._words.words({ size }));
  }

  list({ features, type = 'random', count = [1, 8], size = [5, 15] } = {}) {
    const LIST_ITEM_TYPES = ['ordered', 'bullet', 'task'];
    let itemCount = typeof count === 'number' ? count : this._prng.randomInt(...count);
    const t = type === 'random' ? LIST_ITEM_TYPES[this._prng.randomInt(0, 2)] : type;
    const items = [];
    while (itemCount > 0) {
      const c = this._prng.randomInt(1, itemCount);
      let content = this.paragraph({ features, size });
      if (c > 1) {
        content += `\n${this.list({ features, type, count: c - 1, size })}`;
      }
      items.push(this._listItem(t, content));
      itemCount -= c;
    }
    return items.join('\n');
  }

  // inline //
  codeSpan(options) {
    return `\`${this._content(options)}\``;
  }

  emphasis({ level = [1, 3], options } = {}) {
    const lvl = typeof level === 'number' ? level : this._prng.randomInt(...level);
    const str = '_*'.charAt(this._prng.randomInt(0, 1)).repeat(lvl);
    return `${str}${this._content(options)}${str}`;
  }

  link({ url = 'https://miso.ai', ...options } = {}) {
    return `[${this._content(options)}](${url})`;
  }

  rawHtml({} = {}) {
    return `<div>${this._svg()}</div>`;
  }

  _svg() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calculator" viewBox="0 0 16 16"><path d="M12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/><path d="M4 2.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3-6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3-6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"/></svg>`;
  }

  // TODO: ref link
  // TODO: autolink
  // TODO: hard line break

  _INLINE_FEATURES = {
    'code-span': () => ['`', '`'],
    'emphasis-1': () => this._multiply(this._emphasisAdfix(1), 2),
    'emphasis-2': () => this._multiply(this._emphasisAdfix(2), 2),
    'emphasis-3': () => this._multiply(this._emphasisAdfix(3), 2),
    'strikethrough': () => ['~', '~'],
    'link': ({ url = 'https://miso.ai' } = {}) => [`[`, `](${url})`],
  };

  _emphasisAdfix(level = [1, 3]) {
    const lvl = typeof level === 'number' ? level : this._prng.randomInt(...level);
    return '_*'.charAt(this._prng.randomInt(0, 1)).repeat(lvl);
  }

  get _INLINE_FEATURE_LIST() {
    return Object.keys(this._INLINE_FEATURES);
  }

  get _INLINE_FEATURE_SET() {
    return new Set(this._INLINE_FEATURE_LIST);
  }

  // decorator //
  decorateInlineFeatures({ features, size = [1, 3], rest = [0, 8] } = {}) {
    features = features || this._INLINE_FEATURE_LIST;
    features = features.filter(f => this._INLINE_FEATURE_SET.has(f));

    const unused = this._shuffle([...features]);
    let unusedCursor = unused.length - 1;

    const rollRest = () => typeof rest === 'number' ? rest : this._prng.randomInt(...rest);
    const rollFeatureSize = () => typeof size === 'number' ? size : this._prng.randomInt(...size);
    const rollFeatureType = () => unusedCursor >= 0 ? unused[unusedCursor--] : features[this._prng.randomInt(0, features.length - 1)];

    const self = this;
    return function *(iterator) {
      let count = rollRest();
      let suffix;

      yield* iterateWithLastItemSignal(iterator, function *(word, last) {
        // prefix if necessary
        if (!suffix && count === 0) {
          const [prefix, s] = self._INLINE_FEATURES[rollFeatureType()]();
          word = `${prefix}${word}`;
          count = rollFeatureSize();
          suffix = s;
        }

        // consume word count
        count--;

        // suffix if necessary
        if (suffix) {
          const len = word.length;
          const lastChar = word.charAt(len - 1);
          if (isPunctuation(lastChar)) {
            word = `${word.substring(0, len - 1)}${suffix}${lastChar}`;
            suffix = undefined;
            count = rollRest();
          } else if (last || count === 0) {
            word = `${word}${suffix}`;
            suffix = undefined;
            count = rollRest();
          }
        }

        // output
        yield word;
      });
    };
  }

  decorateCitation(sources, { density = 0.667, unused, ...options }) {
    const sourceLength = sources.length;
    const rollIndex = () => unused && unused.length ? unused.pop() : this._prng.randomInt(0, sourceLength - 1);

    const self = this;
    return function *(iterator) {
      for (const word of iterator) {
        // not ended with alphabet or number -> last word in sentence
        if (word.charAt(word.length - 1) === '.' && self._prng.random() < density) {
          yield `${word}${self._citation(options, sources[rollIndex()])}`;
        } else {
          yield word;
        }
      }
    };
  }

  // helper //
  _content({ size = [1, 3], content } = {}) {
    return content || this._words.words({ size });
  }

  _blockQuote(content) {
    return content.split('\n').map(line => `> ${line}`).join('\n');
  }

  _indent(size, content) {
    return content.split('\n').map(line => ' '.repeat(size) + line).join('\n');
  }

  _listItem(type, content) {
    const [firstLine, restLines] = content.split('\n', 2);
    const result = `${this._listItemPrefix(type)} ${firstLine}`;
    const indentSize = type === 'ordered' ? 3 : 2;
    return !restLines ? result : result + `\n${this._indent(indentSize, restLines)}`;
  }

  _listItemPrefix(type, checked = 'random') {
    switch (type) {
      case 'ordered':
        return '1.';
      case 'bullet':
        return '-';
      case 'task':
        const mark = (checked === 'random' ? this._prng.random() < 0.5 : !!checked) ? 'x' : ' ';
        return `- [${mark}]`;
      default:
        throw new Error(`unknown list item type: ${type}`);
    }
  }

  _codeContent({ lang, size = [10, 30] }) {
    return this._prng.randomBool() ? this._code[lang || 'any']() : this._words.words({ output: 'multiline', size });
  }

  _tableRow(cells) {
    return `| ${cells.join(' | ')} |`;
  }

  _multiply(obj, i) {
    const arr = [];
    for (let j = 0; j < i; j++) {
      arr.push(typeof obj === 'function' ? obj() : obj);
    }
    return arr;
  }

  _shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this._prng.randomInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  _imageUrl(size) {
    const seed = this._prng.randomInt(0, 999);
    const sizePath = Array.isArray(size) ? size.length > 1 ? `${size[0]}/${size[1]}` : `${size[0]}` : `${size}`;
    return `https://picsum.photos/seed/${seed}/${sizePath}`;
  }

  _citation({ link, start, end }, { index, url }) {
    return link ? `[${start}${index}${end}](${url})` : `${start}${index}${end}`;
  }

}

// helpers //
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

function isPunctuation(char) {
  return char === '.' || char === ',' || char === '!' || char === '?' || char === ':' || char === ';';
}
