import * as words from './words.js';
import { imageUrl, sample } from './utils.js';
import * as md from './markdown.js';

const DAY = 1000 * 60 * 60 * 24;
const WEEK = DAY * 7;

export function date({} = {}) {
  const now = Date.now();
  const max = now - DAY;
  const min = max - WEEK * 8;
  return new Date(min + Math.random() * (max - min)).toISOString();
}

export function image({ size = 300 } = {}) {
  return imageUrl(size);
}

export function authors({ size = [1, 3] } = {}) {
  return words.words({
    size,
    decorates: ['title'],
    output: 'array',
  });
}

export function tags({ size = [1, 4] } = {}) {
  return words.words({
    size,
    output: 'array',
  });
}

// TODO: categories

export function title({ size = [2, 6] } = {}) {
  return words.words({
    size,
    decorates: ['title'],
  });
}

export function term({ field }) {
  const random = Math.random();
  const size = random < 0.7 ? 1 : random < 0.9 ? 2 : 3;
  return words.words({
    size,
    decorates: ['title'],
  });
}

export function description({ size = [10, 20], ...options } = {}) {
  const decorator = Object.keys(options).length ? ['description', options] : 'description';
  return words.words({
    size,
    decorates: [decorator],
  });
}

export function html({ paragraphs = 8, sections, paragraph, image: imageOptions } = {}) {
  paragraph = {
    size: [30, 60],
    ...paragraph,
  };
  imageOptions = {
    size: [480, 270],
    ...imageOptions,
  };
  if (sections === undefined) {
    sections = Math.floor(paragraphs * (1 + Math.random()) / 4);
  }
  sections = Math.max(1, Math.min(sections, paragraphs));
  const content = [];
  const pps = paragraphs / sections;
  let j = 0;
  for (let i = 0; i < sections; i++) {
    if (i > 0) {
      content.push(`<h4>${title()}</h4>`);
    }
    while (j++ < (i + 1) * pps) {
      content.push(`<p>${description(paragraph)}</p>`);
    }
    content.push(`<div class="image-container"><img src="${image(imageOptions)}"></div>`);
  }
  return content.join('');
}

export function availability() {
  return Math.random() > 0.3 ? 'IN_STOCK' : 'OUT_OF_STOCK';
}

export function price() {
  return Math.floor(Math.random() * 10000) / 100;
}

export function rating() {
  return Math.floor(Math.random() * 500) / 100 + 1;
}

export function answer({ sources, format, citation, sampling, features }) {
  switch (format) {
    case 'markdown':
      let index = 1;
      sources = sources.map(({ url }) => ({ url, index: index++ }));
      return md.markdown({ sources, citation, sampling, features });
    case 'plaintext':
    default:
      return words.words({
        min: sample(50, sampling),
        max: sample(50, sampling),
        decorates: ['description'],
      });
  }
}
