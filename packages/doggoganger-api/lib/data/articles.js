const FIELDS = new Set([
  'cover_image',
  'url',
  'created_at',
  'updated_at',
  'published_at',
]);

export class Articles {

  constructor(data) {
    this._fields = data._lorem.fields;
    this._utils = data._lorem.utils;
  }

  _article({ html, fl = [] } = {}) {
    const { _fields: fields, _utils: utils } = this;

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
        article[field] = this._property(article, field);
      }
    }

    return article;
  }

  _property({ product_id }, field) {
    const fields = this._fields;

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
