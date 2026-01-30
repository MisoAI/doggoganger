// 2025 date range for random date generation
const DATE_MIN = Date.UTC(2025, 0, 1);  // 2025-01-01
const DATE_MAX = Date.UTC(2025, 11, 31, 23, 59, 59, 999);  // 2025-12-31

export class Fields {

  constructor(lorem) {
    this._prng = lorem._prng;
    this._words = lorem.words;
    this._markdown = lorem.markdown;
  }

  date({} = {}) {
    return new Date(DATE_MIN + this._prng.random() * (DATE_MAX - DATE_MIN)).toISOString();
  }

  image({ size = 300 } = {}) {
    return this._imageUrl(size);
  }

  authors({ size = [1, 3] } = {}) {
    return this._words.words({
      size,
      decorates: ['title'],
      output: 'array',
    });
  }

  tags({ size = [1, 4] } = {}) {
    return this._words.words({
      size,
      output: 'array',
    });
  }

  // TODO: categories

  title({ size = [2, 6] } = {}) {
    return this._words.words({
      size,
      decorates: ['title'],
    });
  }

  term({ field } = {}) {
    const random = this._prng.random();
    const size = random < 0.7 ? 1 : random < 0.9 ? 2 : 3;
    return this._words.words({
      size,
      decorates: ['title'],
    });
  }

  description({ size = [10, 20], ...options } = {}) {
    const decorator = Object.keys(options).length ? ['description', options] : 'description';
    return this._words.words({
      size,
      decorates: [decorator],
    });
  }

  html({ paragraphs = 8, sections, paragraph, image: imageOptions } = {}) {
    paragraph = {
      size: [30, 60],
      ...paragraph,
    };
    imageOptions = {
      size: [480, 270],
      ...imageOptions,
    };
    if (sections === undefined) {
      sections = Math.floor(paragraphs * (1 + this._prng.random()) / 4);
    }
    sections = Math.max(1, Math.min(sections, paragraphs));
    const content = [];
    const pps = paragraphs / sections;
    let j = 0;
    for (let i = 0; i < sections; i++) {
      if (i > 0) {
        content.push(`<h4>${this.title()}</h4>`);
      }
      while (j++ < (i + 1) * pps) {
        content.push(`<p>${this.description(paragraph)}</p>`);
      }
      content.push(`<div class="image-container"><img src="${this.image(imageOptions)}"></div>`);
    }
    return content.join('');
  }

  availability() {
    return this._prng.random() > 0.3 ? 'IN_STOCK' : 'OUT_OF_STOCK';
  }

  price() {
    return Math.floor(this._prng.random() * 10000) / 100;
  }

  rating() {
    return Math.floor(this._prng.random() * 500) / 100 + 1;
  }

  answer({ sources, format, citation, sampling, features }) {
    switch (format) {
      case 'markdown':
        let index = 1;
        sources = sources.map(({ url }) => ({ url, index: index++ }));
        return this._markdown.markdown({ sources, citation, sampling, features });
      case 'plaintext':
      default:
        return this._words.words({
          min: this._sample(50, sampling),
          max: this._sample(50, sampling),
          decorates: ['description'],
        });
    }
  }

  // helpers //
  _imageUrl(size) {
    const seed = this._prng.randomInt(0, 999);
    const sizePath = Array.isArray(size) ? size.length > 1 ? `${size[0]}/${size[1]}` : `${size[0]}` : `${size}`;
    return `https://picsum.photos/seed/${seed}/${sizePath}`;
  }

  _sample(size, sampling) {
    return sampling !== undefined ? Math.ceil(size * sampling) : size;
  }

}
