import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { lorem } from '../lib/index.js';

const SEED = 42;

function generate(seed) {
  const l = lorem({ seed });

  return {
    // Words
    words: l.words.words({ size: 10 }),
    wordsArray: l.words.words({ size: 5, output: 'array' }),
    wordsTitle: l.words.words({ size: 8, decorates: ['title'] }),
    wordsDescription: l.words.words({ size: 20, decorates: ['description'] }),
    wordsMultiline: l.words.words({ size: 30, output: 'multiline' }),

    // Fields
    title: l.fields.title(),
    description: l.fields.description(),
    authors: l.fields.authors(),
    tags: l.fields.tags(),
    date: l.fields.date(),
    image: l.fields.image(),
    price: l.fields.price(),
    rating: l.fields.rating(),
    availability: l.fields.availability(),

    // PRNG
    uuid: l.prng.uuid(),
    randomInts: [
      l.prng.randomInt(0, 100),
      l.prng.randomInt(0, 100),
      l.prng.randomInt(0, 100),
    ],

    // PRNG
    shortId: l.prng.shortId(),

    // Utils
    shuffled: l.utils.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),

    // Markdown
    hr: l.markdown.hr(),
    heading: l.markdown.atxHeading({ level: [2, 4], size: [3, 6] }),
    paragraph: l.markdown.paragraph({ size: [15, 25] }),
    table: l.markdown.table({ columns: [2, 3], rows: [2, 4] }),
    list: l.markdown.list({ count: 3, size: [3, 8] }),
    codeBlock: l.markdown.fencedCodeBlock({ size: [5, 10] }),

    // Complex: full markdown document
    markdown: l.markdown.markdown({ sampling: 0.5 }),

    // Complex: HTML content
    html: l.fields.html({ paragraphs: 3, sections: 2 }),

    // Complex: answer generation
    answer: l.fields.answer({
      sources: [
        { url: 'https://example.com/1' },
        { url: 'https://example.com/2' },
        { url: 'https://example.com/3' },
      ],
      format: 'markdown',
      citation: { link: true, start: '[', end: ']' },
      sampling: 0.7,
      features: ['code-span', 'emphasis-1', 'lang-javascript'],
    }),
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
