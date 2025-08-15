import { fields, utils } from '@miso.ai/lorem';

export function *images({ rows, ...options } = {}) {
  for (let i = 0; i < rows; i++) {
    yield image({ ...options, index: i });
  }
}

function image({ fl = [] } = {}) {
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
