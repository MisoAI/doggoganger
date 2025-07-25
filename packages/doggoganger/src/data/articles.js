import { fields, utils } from '@miso.ai/lorem';

const FIELDS = new Set([
  'cover_image',
  'url',
  'created_at',
  'updated_at',
  'published_at',
]);

export function *articles({ rows, ...options } = {}) {
  for (let i = 0; i < rows; i++) {
    yield article({ ...options, index: i });
  }
}

function article({ html, fl = [] } = {}) {
  const id = utils.id();

  const article = {
    product_id: id,
    authors: fields.authors(),
    categories: [],
    tags: fields.tags(),
    title: fields.title({ size: [4, 10] }),
    snippet: fields.description({ size: [20, 40] }),
    html: fields.html(html),
  };

  for (const field of fl) {
    if (FIELDS.has(field)) {
      article[field] = property(article, field);
    }
  }

  return article;
}

function property({ product_id }, field) {
  switch (field) {
    case 'cover_image':
      return fields.image();
    case 'url':
      return `/products/${product_id}`;
    case 'created_at':
    case 'updated_at':
    case 'published_at':
      return fields.date();
  }
}
