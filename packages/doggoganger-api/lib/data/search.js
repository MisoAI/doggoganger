import { excludeHtml } from '../utils.js';

export class Search {

  constructor(data) {
    this._data = data;
  }

  _searchResults({
    _ctrl = {},
    q,
    fl = ['cover_image', 'url'],
    rows = 10,
    facets,
    _meta: {
      page = 0,
    } = {},
  }) {
    const { prng } = this._data._lorem;
    const total = _ctrl.total !== undefined ? _ctrl.total : prng.randomInt(1000, 10000);
    const products = this._data.articles({ rows: Math.min(total - page * rows, rows), fl }).map(excludeHtml);
    const facet_counts = facets ? { facet_fields: this._data.facets({ facets, _ctrl }) } : undefined;

    return {
      products,
      total,
      facet_counts,
    };
  }

}
