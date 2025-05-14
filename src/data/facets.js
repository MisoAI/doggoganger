import * as fields from './fields.js';

const DEFAULT_FACET_SIZE = 5;
const MAX_FACET_SIZE = 10;
const MIN_FACET_SIZE = 1;

const HIGHEST_FACET_COUNT_RATIO_RANGE = [1000, 5000];
const NEXT_FACET_COUNT_RATIO_RANGE = [0.75, 0.25];

export function facets({ facets, ...options } = {}) {
  const results = {};
  for (let facet of facets) {
    if (typeof facet === 'string') {
      facet = { field: facet };
    }
    results[facet.field] = facetCountList(facet, options);
  }
  return results;
}

function facetCountList(facet, { _ctrl = {}, ...options } = {}) {
  let { field, size = DEFAULT_FACET_SIZE } = facet;
  size = _ctrl.total === 0 ? 0 : Math.max(MIN_FACET_SIZE, Math.min(size, MAX_FACET_SIZE));
  let count = highestFacetCountValue(field, options);

  const usedTerms = new Set();
  const results = [];
  for (let i = 0; i < size; i++) {
    results.push([ getTerm(field, usedTerms), count ]);
    count = nextFacetCountValue(count, field, options);
  }
  return results;
}

function getTerm(field, usedTerms) {
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

function highestFacetCountValue(field, options) {
  // TODO: capped at _ctrl.total
  const [min, max] = HIGHEST_FACET_COUNT_RATIO_RANGE;
  return Math.ceil(Math.random() * (max - min) + min);
}

function nextFacetCountValue(value, field, options) {
  const [min, max] = NEXT_FACET_COUNT_RATIO_RANGE;
  const ratio = Math.random() * (max - min) + min;
  return Math.ceil(value * ratio);
}
