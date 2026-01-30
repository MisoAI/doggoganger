export class Products {

  constructor(data) {
    this._lorem = data._lorem;
  }

  _product({} = {}) {
    const { fields, prng, utils } = this._lorem;

    const id = prng.shortId();
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
