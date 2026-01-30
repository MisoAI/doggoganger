import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { misoData } from '../lib/index.js';

const SEED = 42;

function generate(seed) {
  const data = misoData({ seed });

  return {
    // Products
    products: data.products({ rows: 3 }),

    // Articles
    articles: data.articles({ rows: 3, fl: ['cover_image', 'url'] }),

    // Questions
    questions: data.questions({ rows: 3 }),

    // Images
    images: data.images({ rows: 3 }),

    // Completions
    completions: data.completions({ q: 'test', completion_fields: ['title'], rows: 3 }),

    // Facets
    facets: data.facets({ facets: ['category', 'brand'] }),

    // Search results
    searchResults: data.searchResults({ q: 'test', rows: 5 }),

    // Answer
    answer: data.answer({ question: 'What is this?' }, { answerFormat: 'markdown' }),
  };
}

test('same seed produces identical output', () => {
  const output1 = generate(SEED);
  const output2 = generate(SEED);

  assert.equal(output1, output2);
});

test('different seeds produce different output', () => {
  const output1 = generate(SEED);
  const output2 = generate(SEED + 1);

  assert.not.equal(output1, output2);
});

test.run();
