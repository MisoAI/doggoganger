export class Images {

  constructor(data) {
    this._fields = data._lorem.fields;
    this._utils = data._lorem.utils;
  }

  _image({ fl = [] } = {}) {
    const { _fields: fields, _utils: utils } = this;

    const id = utils.id();

    return {
      product_id: id,
      image_src: fields.image({ size: [1200, 400] }),
      image_alt: fields.title({ size: [2, 4] }),
      title: fields.title({ size: [4, 10] }),
      url: `/products/${id}`,
      created_at: fields.date(),
      updated_at: fields.date(),
      published_at: fields.date(),
    };
  }

}
