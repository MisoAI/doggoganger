import { randomInt, imageUrl, shuffle, iterateWithLastItemSignal } from './utils.js';
import * as words from './words.js';
import * as languages from './languages.js';

// TODO: wild mode that generates edge cases

function extractLangFeatures(features = []) {
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

export function markdown({ sources, citation, features, blocks = [8, 12], sampling = 1 } = {}) {
  let languages = [];
  [languages, features] = extractLangFeatures(features);
  // TODO: block features
  let result = sample([
    () => atxHeading({ features }),
    () => paragraph({ sources, citation, features }),
    ...languages.map(lang => () => fencedCodeBlock({ lang, features })),
    ...(languages.length ? [] : [() => fencedCodeBlock({ features })]),
    () => paragraph({ sources, citation, features }),
    () => table({ features }),
    () => image(),
    () => paragraph({ sources, citation, features }),
    () => hr(),
    () => html(),
    () => atxHeading({ features }),
    () => paragraph({ sources, citation, features }),
    () => list({ features }),
    () => paragraph({ sources, citation, features }),
  ], sampling).join('\n\n');
  if (citation && citation.unused && citation.unused.length) {
    // flush all unused citations
    const indicies = [...citation.unused];
    indicies.sort((a, b) => a - b);
    result += indicies.map(index => _citation(citation, sources[index])).join('');
  }
  return result;
}

function sample(fns, sampling) {
  const arr = [];
  for (const fn of fns) {
    if (sampling >= 1 || Math.random() < sampling) {
      arr.push(fn());
    }
  }
  return arr;
}

// leaf blocks //
export function hr() {
  // wild mode: while spaces at the beginning (< 4), in between, in the end
  // wild mode: no line break for '*'
  return '*-_'.charAt(randomInt(0, 2)).repeat(randomInt(3, 6));
}

export function atxHeading({ features, level = [1, 6], size = [1, 8], content }) {
  const words = content || words.words({ size });
  return `${'#'.repeat(randomInt(...level))} ${words}`;
}

export function setextHeading({ features, level = [1, 2], size = [1, 8], content }) {
  const words = content || words.words({ size });
  return `${words}\n${'=-'.charAt(randomInt(...level) - 1).repeat(3)}`;
}

export function linkReferenceDefinition({ label, destination, title }) {
  return `[${label}]: ${destination}${title !== undefined ? ` ${title}` : ''}`;
}

export function indentedCodeBlock({ lang, content, size }) {
  content = content || codeContent({ lang, size }); 
  return indent(4, content);
}

export function fencedCodeBlock({ lang, content, size, fenceChar = '`' }) {
  if (fenceChar === 'random') {
    fenceChar = '`~'.charAt(randomInt(0, 1));
  }
  content = content || codeContent({ lang, size }); 
  // TODO: escape fenceChar in content
  return `${fenceChar.repeat(3)}${lang || ''}\n${content}\n${fenceChar.repeat(3)}`;
}

export function paragraph({ sources, citation, features, size = [20, 50] }) {
  // force all inline features
  const decorates = ['description', decorateInlineFeatures()];
  if (sources && citation) {
    decorates.push(decorateCitation(sources, citation));
  }
  return words.words({ size, decorates });
}

export function table({ features, columns = [2, 4], rows = [2, 8] }) {
  columns = randomInt(...columns);
  rows = randomInt(...rows);
  const defs = [...multiply({ size: 1 }, columns - 1), { size: [3, 8] }];
  const header = words.words({ size: columns, output: 'array' });
  const delimiter = defs.map(() => '---');
  const body = [ header, delimiter ];
  for (let i = 0; i < rows - 1; i++) {
    body.push(defs.map(({ size }) => words.words({ size })));
  }
  return body.map(tableRow).join('\n');
}

export function image({ url, imageSize = [400, 250], ...options } = {}) {
  url = url || imageUrl(imageSize);
  return `![${_content(options)}](${url})`;
}

// container blocks //
export function blockquote({ features, size = [3, 5] }) {
  // TODO
  return _blockquote(words.words({ size }));
}

const LIST_ITEM_TYPES = ['ordered', 'bullet', 'task'];

export function list({ features, type = 'random', count = [1, 8], size = [5, 15] }) {
  count = typeof count === 'number' ? count : randomInt(...count);
  const t = type === 'random' ? LIST_ITEM_TYPES[Math.floor(3 * Math.random())] : type;
  const items = [];
  while (count > 0) {
    const c = randomInt(1, count);
    let content = paragraph({ features, size });
    if (c > 1) {
      content += `\n${list({ features, type, count: c - 1, size })}`;
    }
    items.push(listItem(t, content));
    count -= c;
  }
  return items.join('\n');
}

// inline //
export function codeSpan(options) {
  return `\`${_content(options)}\``;
}

export function emphasis({ level = [1, 3], options }) {
  level = typeof level === 'number' ? level : randomInt(...level);
  const str = '_*'.charAt(randomInt(0, 1)).repeat(level);
  return `${str}${_content(options)}${str}`;
}

export function link({ url = 'https://miso.ai', ...options } = {}) {
  return `[${_content(options)}](${url})`;
}

export function html({} = {}) {
  return `<div>${svg()}</div>`;
}

function svg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calculator" viewBox="0 0 16 16"><path d="M12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/><path d="M4 2.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3-6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3-6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"/></svg>`;
}

// TODO: ref link
// TODO: autolink
// TODO: hard line break

const INLINE_FEATURES = {
  'code-span': () => ['`', '`'],
  'emphasis-1': () => multiply(_emphasisAdfix(1), 2),
  'emphasis-2': () => multiply(_emphasisAdfix(2), 2),
  'emphasis-3': () => multiply(_emphasisAdfix(3), 2),
  'strikethrough': () => ['~', '~'],
  'link': ({ url = 'https://miso.ai' } = {}) => [`[`, `](${url})`],
};

function _emphasisAdfix(level = [1, 3]) {
  level = typeof level === 'number' ? level : randomInt(...level);
  return '_*'.charAt(randomInt(0, 1)).repeat(level);
}

const INLINE_FEATURE_LIST = Object.keys(INLINE_FEATURES);
const INLINE_FEATURE_SET = new Set(INLINE_FEATURE_LIST);

// decorator //
export function decorateInlineFeatures({ features = INLINE_FEATURE_LIST, size = [1, 3], rest = [0, 8] } = {}) {
  features = features.filter(f => INLINE_FEATURE_SET.has(f));

  const unused = shuffle([...features]);
  let unusedCursor = unused.length - 1;

  const rollRest = () => typeof rest === 'number' ? rest : randomInt(...rest);
  const rollFeatureSize = () => typeof size === 'number' ? size : randomInt(...size);
  const rollFeatureType = () => unusedCursor >= 0 ? unused[unusedCursor--] : features[randomInt(0, features.length - 1)];

  return function *(iterator) {
    let count = rollRest();
    let suffix;

    yield *iterateWithLastItemSignal(iterator, function *(word, last) {
      // prefix if necessary
      if (!suffix && count === 0) {
        const [prefix, s] = INLINE_FEATURES[rollFeatureType()]();
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

export function decorateCitation(sources, { density = 0.667, unused, ...options }) {
  const sourceLength = sources.length;
  const rollIndex = () => unused && unused.length ? unused.pop() : randomInt(0, sourceLength - 1);

  return function *(iterator) {
    for (const word of iterator) {
      // not ended with alphabet or number -> last word in sentence
      if (word.charAt(word.length - 1) === '.' && Math.random() < density) {
        yield `${word}${_citation(options, sources[rollIndex()])}`;
      } else {
        yield word;
      }
    }
  };
}

// helper //
function _content({ size = [1, 3], content } = {}) {
  return content || words.words({ size });
}

function _blockquote(content) {
  return content.split('\n').map(line => `> ${line}`).join('\n');
}

export function indent(size, content) {
  return content.split('\n').map(line => ' '.repeat(size) + line).join('\n');
}

export function listItem(type, content) {
  const [firstLine, restLines] = content.split('\n', 2);
  const result = `${listItemPrefix(type)} ${firstLine}`;
  const indentSize = type === 'ordered' ? 3 : 2;
  return !restLines ? result : result + `\n${indent(indentSize, restLines)}`;
}

function listItemPrefix(type, checked = 'random') {
  switch (type) {
    case 'ordered':
      return '1.';
    case 'bullet':
      return '-';
    case 'task':
      const mark = (checked === 'random' ? Math.random() < 0.5 : !!checked) ? 'x' : ' ';
      return `- [${mark}]`;
    default:
      throw new Error(`unknown list item type: ${type}`);
  }
}

function codeContent({ lang, size = [10, 30] }) {
  return lang && languages[lang] ? languages[lang]() : words.words({ output: 'multiline', size });
}

function tableRow(cells) {
  return `| ${cells.join(' | ')} |`;
}

function multiply(obj, i) {
  const arr = [];
  for (let j = 0; j < i; j++) {
    arr.push(typeof obj === 'function' ? obj() : obj);
  }
  return arr;
}

function isPunctuation(char) {
  return char === '.' || char === ',' || char === '!' || char === '?' || char === ':' || char === ';';
}

function _citation({ link, start, end }, { index, url }) {
  return link ? `[${start}${index}${end}](${url})` : `${start}${index}${end}`;
}
