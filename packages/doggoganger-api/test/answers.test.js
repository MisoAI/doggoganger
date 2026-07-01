import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { misoData } from '../lib/data/index.js';

const PAYLOAD = { q: 'What is Miso?' };

test('question_id from payload is honored', () => {
  const { question_id } = misoData({ seed: 1 }).answer({ ...PAYLOAD, question_id: 'fixed-id-123' });
  assert.is(question_id, 'fixed-id-123');
});

test('falls back to a generated uuid when question_id is absent', () => {
  const { question_id } = misoData({ seed: 1 }).answer(PAYLOAD);
  assert.type(question_id, 'string');
  assert.ok(question_id.length > 0);
});

test('same question_id derives identical content regardless of lorem seed', () => {
  const a = misoData({ seed: 1 }).answer({ ...PAYLOAD, question_id: 'fixed-id-123' });
  const b = misoData({ seed: 999 }).answer({ ...PAYLOAD, question_id: 'fixed-id-123' });
  assert.equal(a, b);
});

test('different question_ids derive different content', () => {
  const a = misoData({ seed: 1 }).answer({ ...PAYLOAD, question_id: 'id-a' });
  const b = misoData({ seed: 1 }).answer({ ...PAYLOAD, question_id: 'id-b' });
  assert.not.equal(a, b);
});

test('fallback question_id is deterministic for the same lorem seed', () => {
  const a = misoData({ seed: 5 }).answer(PAYLOAD);
  const b = misoData({ seed: 5 }).answer(PAYLOAD);
  assert.equal(a, b);
});

test('answer() does not perturb the caller PRNG stream', () => {
  // Baseline: next PRNG draw without any answer() call.
  const expected = misoData({ seed: 7 })._lorem.prng.random();

  // Same seed, but draw after generating an answer with a fixed question_id.
  const data = misoData({ seed: 7 });
  data.answer({ ...PAYLOAD, question_id: 'some-id' });
  const actual = data._lorem.prng.random();

  assert.is(actual, expected);
});

test.run();
