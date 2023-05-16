import * as u from './utils.js';
import * as fields from './fields.js';

export function *articles({ rows, ...options } = {}) {
  for (let i = 0; i < rows; i++) {
    yield article({ ...options, index: i });
  }
}

function article({} = {}) {
  const id = u.id();

  return {
    product_id: id,
    authors: fields.authors(),
    categories: [],
    tags: fields.tags(),
    title: fields.title({ size: [4, 10] }),
    description: fields.description({ size: [20, 40] }),
    //html,
    cover_image: fields.image(),
    url: `/products/${id}`,
  };
}
