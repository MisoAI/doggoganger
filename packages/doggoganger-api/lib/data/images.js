export class Images {

  constructor(data) {
    this._lorem = data._lorem;
  }

  _image({ fl = [] } = {}) {
    const { fields, prng } = this._lorem;

    const id = prng.shortId();

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
