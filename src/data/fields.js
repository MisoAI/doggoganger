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
