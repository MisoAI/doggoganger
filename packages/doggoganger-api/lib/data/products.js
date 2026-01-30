export class Products {

  constructor(data) {
    this._fields = data._lorem.fields;
    this._utils = data._lorem.utils;
  }

  _product({} = {}) {
    const { _fields: fields, _utils: utils } = this;

    const id = utils.id();
    const prices = utils.repeat(() => fields.price(), [1, 2]);
    prices.sort((a, b) => a - b);

    return {
      product_id: id,
      authors: fields.authors(),
      categories: [],
      tags: fields.tags(),
      title: fields.title(),
      description: fields.description(),
      cover_image: fields.image(),
      url: `https://dummy.miso.ai/products/${id}`,
      sale_price: prices[0],
      original_price: prices[prices.length - 1],
      rating: fields.rating(),
      availability: fields.availability(),
    };
  }

}
