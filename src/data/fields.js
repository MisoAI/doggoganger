import * as lorem from './lorem.js';
import { imageUrl, sample } from './utils.js';
import * as md from './markdown/index.js';

export function image({ size = 300 } = {}) {
  return imageUrl(size);
}

export function authors({ size = [1, 3] } = {}) {
  return lorem.lorem({
    size,
    decorates: ['title'],
    output: 'array',
  });
}

export function tags({ size = [1, 4] } = {}) {
  return lorem.lorem({
    size,
    output: 'array',
  });
}

// TODO: categories

export function title({ size = [2, 6] } = {}) {
  return lorem.lorem({
    size,
    decorates: ['title'],
  });
}

export function description({ size = [10, 20], ...options } = {}) {
  const decorator = Object.keys(options).length ? ['description', options] : 'description';
  return lorem.lorem({
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

export function answer({ format, sampling, features }) {
  switch (format) {
    case 'markdown':
      return md.markdown({ sampling, features });
    case 'plaintext':
    default:
      return lorem.lorem({
        min: sample(50, sampling),
        max: sample(50, sampling),
        decorates: ['description'],
      });
  }
}
