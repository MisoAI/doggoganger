import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { api } from '../lib/index.js';

const SEED = 42;
// question_id (and thus thread_id) is derived from the seed, so distinct
// questions need distinct seeds to get distinct ids.
const SEED_A = 1;
const SEED_B = 2;

function makeAsk() {
  return api({ detemporize: true }).ask;
}

// Two threads, one question each: 'First' at 00:00, 'Second' at 00:01
function makeAskWithTwoThreads() {
  const ask = makeAsk();
  const { question_id: first } = ask.questions({ question: 'First' }, { seed: SEED_A });
  const { question_id: second } = ask.questions({ question: 'Second' }, { seed: SEED_B });
  return { ask, first, second };
}

test('threads() maps a thread to the v0 entry shape', () => {
  const ask = makeAsk();
  const { question_id } = ask.questions({ question: 'What is Miso?' }, { seed: SEED });

  const [entry] = ask.userHistoryV0.threads();
  assert.equal(entry, {
    id: question_id,
    time: '2026-01-01T00:00:00.000',
    question_id,
    question: 'What is Miso?',
    subscribed: true,
    has_new: false,
  });
});

test('threads() lists the most recently updated thread first', () => {
  const { ask } = makeAskWithTwoThreads();

  assert.equal(ask.userHistoryV0.threads().map(t => t.question), ['Second', 'First']);
});

test('threads() pages with rows and offset', () => {
  const { ask } = makeAskWithTwoThreads();

  assert.equal(ask.userHistoryV0.threads({ rows: 1 }).map(t => t.question), ['Second']);
  assert.equal(ask.userHistoryV0.threads({ rows: 1, offset: 1 }).map(t => t.question), ['First']);
  assert.equal(ask.userHistoryV0.threads({ offset: 2 }), []);
});

test('threads() keeps only threads older than before', () => {
  const { ask } = makeAskWithTwoThreads();

  const threads = ask.userHistoryV0.threads({ before: '2026-01-01T00:01:00.000' });
  assert.equal(threads.map(t => t.question), ['First']);
});

test('openThread returns the question ids of the thread', () => {
  const ask = makeAsk();
  const { question_id: root } = ask.questions({ question: 'Root' }, { seed: SEED_A });
  const { question_id: child } = ask.questions({ question: 'Follow up', parent_question_id: root }, { seed: SEED_B });

  assert.equal(ask.userHistoryV0.openThread({ question_id: root }), {
    question_ids: [root, child],
    has_more: false,
  });
});

test('openThread accepts any question of the thread, not just the root', () => {
  const ask = makeAsk();
  const { question_id: root } = ask.questions({ question: 'Root' }, { seed: SEED_A });
  const { question_id: child } = ask.questions({ question: 'Follow up', parent_question_id: root }, { seed: SEED_B });

  assert.equal(ask.userHistoryV0.openThread({ question_id: child }).question_ids, [root, child]);
});

test('openThread reports has_more when rows cuts the thread short', () => {
  const ask = makeAsk();
  const { question_id: root } = ask.questions({ question: 'Root' }, { seed: SEED_A });
  ask.questions({ question: 'Follow up', parent_question_id: root }, { seed: SEED_B });

  assert.equal(ask.userHistoryV0.openThread({ question_id: root, rows: 1 }), {
    question_ids: [root],
    has_more: true,
  });
});

test('openThread honors order and after', () => {
  const ask = makeAsk();
  const { question_id: root } = ask.questions({ question: 'Root' }, { seed: SEED_A });
  const { question_id: child } = ask.questions({ question: 'Follow up', parent_question_id: root }, { seed: SEED_B });

  assert.equal(ask.userHistoryV0.openThread({ question_id: root, order: 'desc' }).question_ids, [child, root]);
  assert.equal(ask.userHistoryV0.openThread({ question_id: root, after: root }).question_ids, [child]);
  assert.equal(ask.userHistoryV0.openThread({ question_id: root, after: child }).question_ids, []);
});

test('openThread throws 404 for an unknown question_id', () => {
  const ask = makeAsk();
  try {
    ask.userHistoryV0.openThread({ question_id: 'nonexistent-id' });
    assert.unreachable('should have thrown');
  } catch (error) {
    assert.is(error.status, 404);
  }
});

test('renameThread changes the thread title', () => {
  const ask = makeAsk();
  const { question_id } = ask.questions({ question: 'Old' }, { seed: SEED });

  ask.userHistoryV0.renameThread({ question_id, title: 'New' });

  assert.equal(ask.userHistoryV0.threads().map(t => t.question), ['New']);
});

test('renameThread throws 404 for an unknown question_id', () => {
  const ask = makeAsk();
  try {
    ask.userHistoryV0.renameThread({ question_id: 'nonexistent-id', title: 'New' });
    assert.unreachable('should have thrown');
  } catch (error) {
    assert.is(error.status, 404);
  }
});

test('deleteThreads removes the listed threads and counts them', () => {
  const { ask, first, second } = makeAskWithTwoThreads();

  const result = ask.userHistoryV0.deleteThreads({ ids: [first, 'nonexistent-id'] });

  assert.equal(result, { deleted_count: 1 });
  assert.equal(ask.userHistoryV0.threads().map(t => t.id), [second]);
});

test('deleteAllThreads clears the history', () => {
  const { ask } = makeAskWithTwoThreads();

  ask.userHistoryV0.deleteAllThreads({});

  assert.equal(ask.userHistoryV0.threads(), []);
});

test('subscribe and unsubscribe toggle the thread subscription', () => {
  const ask = makeAsk();
  const { question_id: thread_id } = ask.questions({ question: 'What is Miso?' }, { seed: SEED });

  ask.userHistoryV0.unsubscribe({ thread_id });
  assert.is(ask.userHistoryV0.threads()[0].subscribed, false);

  ask.userHistoryV0.subscribe({ thread_id });
  assert.is(ask.userHistoryV0.threads()[0].subscribed, true);
});

test('subscribe throws 404 for an unknown thread_id', () => {
  const ask = makeAsk();
  try {
    ask.userHistoryV0.subscribe({ thread_id: 'nonexistent-id' });
    assert.unreachable('should have thrown');
  } catch (error) {
    assert.is(error.status, 404);
  }
});

test('updates reports the account level indicator', () => {
  const ask = makeAsk();
  assert.equal(ask.userHistoryV0.updates({}), { has_new: false });

  ask.userHistory.generateThreads({ rows: 4 }, { seed: SEED });
  assert.equal(ask.userHistoryV0.updates({}), { has_new: true });
});

test('dismissOverall hides the account level indicator', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: 4 }, { seed: SEED });

  ask.userHistoryV0.dismissOverall({});

  assert.equal(ask.userHistoryV0.updates({}), { has_new: false });
  // The threads themselves stay unread
  assert.ok(ask.userHistoryV0.threads().some(t => t.has_new));
});

test('dismissThread clears the indicator of a single thread', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: 4 }, { seed: SEED });
  const { id } = ask.userHistoryV0.threads().find(t => t.has_new);

  ask.userHistoryV0.dismissThread({ thread_id: id });

  assert.is(ask.userHistoryV0.threads().find(t => t.id === id).has_new, false);
});

test('touchThread raises the indicator and bumps the thread time', () => {
  const { ask, second } = makeAskWithTwoThreads();

  const result = ask.userHistoryV0.touchThread({ thread_id: second });

  assert.equal(result, { generated: false, question_id: undefined, touched: 1 });
  const [entry] = ask.userHistoryV0.threads();
  assert.is(entry.id, second);
  assert.is(entry.time, '2026-01-01T00:02:00.000');
  assert.is(entry.has_new, true);
});

test('touchThread with generate appends a new question to the thread', () => {
  const ask = makeAsk();
  const { question_id: root } = ask.questions({ question: 'Root' }, { seed: SEED_A });

  const { generated, question_id, touched } = ask.userHistoryV0.touchThread({ thread_id: root, generate: true }, { seed: SEED_B });

  assert.is(generated, true);
  assert.is(touched, 1);
  assert.ok(question_id);
  assert.equal(ask.userHistoryV0.openThread({ question_id: root }).question_ids, [root, question_id]);
  assert.is(ask.userHistoryV0.threads()[0].has_new, true);
  // The generated answer is available right away
  assert.is(ask.answer(question_id).finished, true);
});

test('touchThread throws 404 for an unknown thread_id', () => {
  const ask = makeAsk();
  try {
    ask.userHistoryV0.touchThread({ thread_id: 'nonexistent-id' });
    assert.unreachable('should have thrown');
  } catch (error) {
    assert.is(error.status, 404);
  }
});

test.run();
