import { fields, utils } from '@miso.ai/lorem';

export function *products({ rows, ...options } = {}) {
  for (let i = 0; i < rows; i++) {
    yield product({ ...options, index: i });
  }
}

function product({} = {}) {
  const id = utils.id();
  const prices = utils.repeat(fields.price, [1, 2]);
  prices.sort();

  return {
    product_id: id,
    authors: fields.authors(),
    categories: [],
    tags: fields.tags(),
    title: fields.title(),
    description: fields.description(),
    //html,
    cover_image: fields.image(),
    url: `https://dummy.miso.ai/products/${id}`,
    sale_price: prices[0],
    original_price: prices[prices.length - 1],
    rating: fields.rating(),
    availability: fields.availability(),
  };
}
