const FIELDS = new Set([
  'cover_image',
  'url',
  'created_at',
  'updated_at',
  'published_at',
]);

export class Articles {

  constructor(data) {
    this._lorem = data._lorem;
  }

  _article({ html, fl = [] } = {}) {
    const { fields, prng } = this._lorem;

    const id = prng.shortId();

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
        article[field] = this._property(article, field);
      }
    }

    return article;
  }

  _property({ product_id }, field) {
    const { fields } = this._lorem;

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

}
