import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { api } from '../lib/index.js';

// With temporal: false, each answer() call increments an internal index used
// as the elapsed time (seconds). MOCK_POLLING_INTERVAL = 1s, stages are:
//   fetch: 1.5s, verify: 1.5s, generate: 1.5s  (total 4.5s)
// So: poll 1 → fetch, poll 2 → verify, poll 3 → generate,
//     poll 4 → generate, poll 5+ → result

const SEED = 42;
const PAYLOAD = { q: 'What is Miso?' };

function makeAsk() {
  return api({ temporal: false }).ask;
}

test('questions() returns a question_id', () => {
  const ask = makeAsk();
  const result = ask.questions(PAYLOAD, { seed: SEED });
  assert.ok(result.question_id);
  assert.type(result.question_id, 'string');
});

test('answer stages progress fetch → verify → generate → result', () => {
  const ask = makeAsk();
  const { question_id } = ask.questions(PAYLOAD, { seed: SEED });

  const poll1 = ask.answer(question_id);
  assert.is(poll1.answer_stage, 'fetch');
  assert.is(poll1.finished, false);

  const poll2 = ask.answer(question_id);
  assert.is(poll2.answer_stage, 'verify');
  assert.is(poll2.finished, false);

  const poll3 = ask.answer(question_id);
  assert.is(poll3.answer_stage, 'generate');
  assert.is(poll3.finished, false);
});

test('answer eventually reaches result stage with finished=true', () => {
  const ask = makeAsk();
  const { question_id } = ask.questions(PAYLOAD, { seed: SEED });

  let last;
  for (let i = 0; i < 100; i++) {
    last = ask.answer(question_id);
    if (last.finished) break;
  }

  assert.is(last.answer_stage, 'result');
  assert.is(last.finished, true);
  assert.type(last.answer, 'string');
  assert.ok(last.answer.length > 0);
});

test('answer result is deterministic with same seed', () => {
  const ask1 = makeAsk();
  const { question_id: qid1 } = ask1.questions(PAYLOAD, { seed: SEED });

  const ask2 = makeAsk();
  const { question_id: qid2 } = ask2.questions(PAYLOAD, { seed: SEED });

  assert.is(qid1, qid2);

  // Advance both to the same poll and compare
  for (let i = 0; i < 5; i++) {
    const r1 = ask1.answer(qid1);
    const r2 = ask2.answer(qid2);
    assert.equal(r1, r2);
  }
});

test('answer throws 404 for unknown question_id', () => {
  const ask = makeAsk();
  try {
    ask.answer('nonexistent-id');
    assert.unreachable('should have thrown');
  } catch (err) {
    assert.is(err.status, 404);
  }
});

test.run();
