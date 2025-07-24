import { utils } from '@miso.ai/lorem';
import { articles } from './articles.js';
import { facets as generateFacetFields } from './facets.js';

export function searchResults({
  _ctrl = {},
  q,
  fl = ['cover_image', 'url'],
  rows = 10,
  facets,
  _meta: {
    page = 0,
  } = {},
}) {
  const total = _ctrl.total !== undefined ? _ctrl.total : utils.randomInt(1000, 10000);
  const products = [...articles({ rows: Math.min(total - page * rows, rows), fl })].map(utils.excludeHtml);
  const facet_counts = facets ? { facet_fields: generateFacetFields({ facets, _ctrl }) } : undefined;

  return {
    products,
    total,
    facet_counts,
  };
}
