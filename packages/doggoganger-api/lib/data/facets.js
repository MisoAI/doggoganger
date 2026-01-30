const DEFAULT_FACET_SIZE = 5;
const MAX_FACET_SIZE = 10;
const MIN_FACET_SIZE = 1;

const HIGHEST_FACET_COUNT_RATIO_RANGE = [1000, 5000];
const NEXT_FACET_COUNT_RATIO_RANGE = [0.75, 0.25];

export class Facets {

  constructor(data) {
    this._lorem = data._lorem;
  }

  _facets({ facets, ...options } = {}) {
    const results = {};
    for (let facet of facets) {
      if (typeof facet === 'string') {
        facet = { field: facet };
      }
      results[facet.field] = this._facetCountList(facet, options);
    }
    return results;
  }

  _facetCountList(facet, { _ctrl = {}, ...options } = {}) {
    let { field, size = DEFAULT_FACET_SIZE } = facet;
    size = _ctrl.total === 0 ? 0 : Math.max(MIN_FACET_SIZE, Math.min(size, MAX_FACET_SIZE));
    let count = this._highestFacetCountValue(field, options);

    const usedTerms = new Set();
    const results = [];
    for (let i = 0; i < size; i++) {
      results.push([this._getTerm(field, usedTerms), count]);
      count = this._nextFacetCountValue(count, field, options);
    }
    return results;
  }

  _getTerm(field, usedTerms) {
    const { fields } = this._lorem;
    if (usedTerms.size > 50) {
      return fields.term({ field });
    }
    while (true) {
      const term = fields.term({ field });
      if (!usedTerms.has(term)) {
        usedTerms.add(term);
        return term;
      }
    }
  }

  _highestFacetCountValue(field, options) {
    const [min, max] = HIGHEST_FACET_COUNT_RATIO_RANGE;
    return this._lorem.prng.randomInt(min, max);
  }

  _nextFacetCountValue(value, field, options) {
    const [min, max] = NEXT_FACET_COUNT_RATIO_RANGE;
    const ratio = min + this._lorem.prng.random() * (max - min);
    return Math.ceil(value * ratio);
  }

}
