import { randomInt, imageUrl, shuffle } from '../utils.js';
import * as lorem from '../lorem.js';

// TODO: wild mode that generates edge cases

export function markdown({ features, blocks = [8, 12] } = {}) {
  // TODO: block features
  return [
    atxHeading({ features }),
    paragraph({ features }),
    fencedCodeBlock({ features }),
    paragraph({ features }),
    table({ features }),
    image(),
    paragraph({ features }),
    hr(),
    atxHeading({ features }),
    paragraph({ features }),
    list({ features }),
    paragraph({ features }),
  ].join('\n\n');
}

// leaf blocks //
export function hr() {
  // wild mode: while spaces at the beginning (< 4), in between, in the end
  // wild mode: no line break for '*'
  return '*-_'.charAt(randomInt(0, 2)).repeat(randomInt(3, 6));
}

export function atxHeading({ features, level = [1, 6], size = [1, 8], content }) {
  const words = content || lorem.lorem({ size });
  return `${'#'.repeat(randomInt(...level))} ${words}`;
}

export function setextHeading({ features, level = [1, 2], size = [1, 8], content }) {
  const words = content || lorem.lorem({ size });
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

export function paragraph({ features, size = [20, 50] }) {
  return lorem.lorem({ size, decorates: ['description', decorate({ features })] });
}

export function table({ features, columns = [2, 4], rows = [2, 8] }) {
  columns = randomInt(...columns);
  rows = randomInt(...rows);
  const defs = [...multiply({ size: 1 }, columns - 1), { size: [3, 8] }];
  const header = lorem.lorem({ size: columns, output: 'array' });
  const delimiter = defs.map(() => '---');
  const body = [ header, delimiter ];
  for (let i = 0; i < rows - 1; i++) {
    body.push(defs.map(({ size }) => lorem.lorem({ size })));
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
  return _blockquote(lorem.lorem({ size }));
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

// TODO: ref link
// TODO: autolink
// TODO: hard line break

const INLINE_FEATURES = {
  'code-span': () => ['`', '`'],
  'emphasis-1': () => multiply(_emphasisAdfix(1), 2),
  'emphasis-2': () => multiply(_emphasisAdfix(2), 2),
  'emphasis-3': () => multiply(_emphasisAdfix(3), 2),
  'link': ({ url = 'https://miso.ai' } = {}) => [`[`, `](${url})`],
};

function _emphasisAdfix(level = [1, 3]) {
  level = typeof level === 'number' ? level : randomInt(...level);
  return '_*'.charAt(randomInt(0, 1)).repeat(level);
}

const INLINE_FEATURE_LIST = Object.keys(INLINE_FEATURES);
const INLINE_FEATURE_SET = new Set(INLINE_FEATURE_LIST);

// decorator //
export function decorate({ features = INLINE_FEATURE_LIST, size = [1, 3], rest = [0, 8] } = {}) {
  features = features.filter(f => INLINE_FEATURE_SET.has(f));

  const unused = shuffle([...features]);
  let unusedCursor = unused.length - 1;

  const rollRest = () => typeof rest === 'number' ? rest : randomInt(...rest);
  const rollFeatureSize = () => typeof size === 'number' ? size : randomInt(...size);
  const rollFeatureType = () => unusedCursor >= 0 ? unused[unusedCursor--] : features[randomInt(0, features.length - 1)];

  return function *(iterator) {
    let count = rollRest();
    let suffix;
    let lastWord;
    for (const word of iterator) {
      if (lastWord) {
        yield lastWord;
      }
      if (count === 0) {
        if (suffix) {
          lastWord = `${word}${suffix}`;
          suffix = undefined;
          count = rollRest();
        } else {
          const [prefix, s] = INLINE_FEATURES[rollFeatureType()]();
          lastWord = `${prefix}${word}`;
          suffix = s;
          count = rollFeatureSize();
        }
      } else {
        lastWord = word;
        count--;
      }
    }
    if (lastWord) {
      yield suffix !== undefined ? `${lastWord}${suffix}` : lastWord;
    }
  };
}

// helper //
function _content({ size = [1, 3], content } = {}) {
  return content || lorem.lorem({ size });
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
  // TODO
  switch (lang) {
    default:
      return lorem.lorem({ output: 'multiline', size });
  }
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
