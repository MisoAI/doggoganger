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

test('root question creates a new thread', () => {
  const ask = makeAsk();
  const { question_id } = ask.questions({ question: 'What is Miso?' }, { seed: SEED });

  const { threads } = ask.userHistory.threads();
  assert.is(threads.length, 1);
  assert.is(threads[0].title, 'What is Miso?');
  assert.ok(threads[0].thread_id);
});

test('threads() entries omit questions_ids', () => {
  const ask = makeAsk();
  ask.questions({ question: 'What is Miso?' }, { seed: SEED });

  const [entry] = ask.userHistory.threads().threads;
  assert.equal(Object.keys(entry).sort(), ['thread_id', 'title', 'updated_at'].sort());
  assert.is(entry.questions_ids, undefined);
});

test('follow-up question is appended to its parent thread', () => {
  const ask = makeAsk();
  const { question_id: root } = ask.questions({ question: 'Root' }, { seed: SEED_A });
  const { question_id: child } = ask.questions({ question: 'Follow up', parent_question_id: root }, { seed: SEED_B });

  // Still a single thread
  const { threads } = ask.userHistory.threads();
  assert.is(threads.length, 1);

  const thread = ask.userHistory.getThread(threads[0].thread_id);
  assert.equal(thread.questions_ids, [root, child]);
});

test('separate root questions create separate threads', () => {
  const ask = makeAsk();
  ask.questions({ question: 'First' }, { seed: SEED_A });
  ask.questions({ question: 'Second' }, { seed: SEED_B });

  const { threads } = ask.userHistory.threads();
  assert.is(threads.length, 2);
  assert.equal(threads.map(t => t.title), ['First', 'Second']);
});

test('follow-up of an unknown parent starts a new thread', () => {
  const ask = makeAsk();
  ask.questions({ question: 'Orphan', parent_question_id: 'nonexistent' }, { seed: SEED });

  const { threads } = ask.userHistory.threads();
  assert.is(threads.length, 1);
  assert.is(threads[0].title, 'Orphan');
});

test('getThread returns the full thread object', () => {
  const ask = makeAsk();
  const { question_id } = ask.questions({ question: 'What is Miso?' }, { seed: SEED });
  const [{ thread_id }] = ask.userHistory.threads().threads;

  const thread = ask.userHistory.getThread(thread_id);
  assert.is(thread.thread_id, thread_id);
  assert.is(thread.title, 'What is Miso?');
  assert.equal(thread.questions_ids, [question_id]);
  assert.ok(thread.updated_at);
});

test('getThread returns a shallow copy', () => {
  const ask = makeAsk();
  ask.questions({ question: 'What is Miso?' }, { seed: SEED });
  const [{ thread_id }] = ask.userHistory.threads().threads;

  const copy = ask.userHistory.getThread(thread_id);
  copy.questions_ids.push('injected');
  copy.title = 'mutated';

  const fresh = ask.userHistory.getThread(thread_id);
  // Mutating the top-level copy does not leak back...
  assert.is(fresh.title, 'What is Miso?');
  // ...but nested references are shared (shallow copy).
  assert.ok(fresh.questions_ids.includes('injected'));
});

test('updateThread updates the title and persists it', () => {
  const ask = makeAsk();
  ask.questions({ question: 'Old title' }, { seed: SEED });
  const [{ thread_id }] = ask.userHistory.threads().threads;

  const updated = ask.userHistory.updateThread(thread_id, { title: 'New title' });
  assert.is(updated.title, 'New title');

  // Persisted for subsequent reads
  assert.is(ask.userHistory.getThread(thread_id).title, 'New title');
  assert.is(ask.userHistory.threads().threads[0].title, 'New title');
});

test('updateThread leaves the title untouched when none is given', () => {
  const ask = makeAsk();
  ask.questions({ question: 'Keep me' }, { seed: SEED });
  const [{ thread_id }] = ask.userHistory.threads().threads;

  const updated = ask.userHistory.updateThread(thread_id, {});
  assert.is(updated.title, 'Keep me');
});

test('updateThread throws 404 for unknown thread_id', () => {
  const ask = makeAsk();
  try {
    ask.userHistory.updateThread('nonexistent-id', { title: 'x' });
    assert.unreachable('should have thrown');
  } catch (err) {
    assert.is(err.status, 404);
  }
});

test('deleteThread removes the thread and its question mapping', () => {
  const ask = makeAsk();
  const { question_id: root } = ask.questions({ question: 'Root' }, { seed: SEED_A });
  ask.questions({ question: 'Follow up', parent_question_id: root }, { seed: SEED_B });
  const [{ thread_id }] = ask.userHistory.threads().threads;

  ask.userHistory.deleteThread(thread_id);
  assert.is(ask.userHistory.threads().threads.length, 0);

  // A new question reusing the (now dangling) parent id starts a fresh thread
  ask.questions({ question: 'Orphan', parent_question_id: root }, { seed: SEED_A });
  const { threads } = ask.userHistory.threads();
  assert.is(threads.length, 1);
  assert.is(threads[0].title, 'Orphan');
});

test('deleteThread throws 404 for unknown thread_id', () => {
  const ask = makeAsk();
  try {
    ask.userHistory.deleteThread('nonexistent-id');
    assert.unreachable('should have thrown');
  } catch (err) {
    assert.is(err.status, 404);
  }
});

test('deleteThreads removes only the listed threads and ignores unknown ids', () => {
  const ask = makeAsk();
  ask.questions({ question: 'First' }, { seed: SEED_A });
  ask.questions({ question: 'Second' }, { seed: SEED_B });
  const [a, b] = ask.userHistory.threads().threads;

  ask.userHistory.deleteThreads({ thread_ids: [a.thread_id, 'nonexistent-id'] });

  const { threads } = ask.userHistory.threads();
  assert.is(threads.length, 1);
  assert.is(threads[0].thread_id, b.thread_id);
});

test('deleteAllThreads clears everything', () => {
  const ask = makeAsk();
  ask.questions({ question: 'First' }, { seed: SEED_A });
  ask.questions({ question: 'Second' }, { seed: SEED_B });

  ask.userHistory.deleteAllThreads();
  assert.is(ask.userHistory.threads().threads.length, 0);
});

test('getThread throws 404 for unknown thread_id', () => {
  const ask = makeAsk();
  try {
    ask.userHistory.getThread('nonexistent-id');
    assert.unreachable('should have thrown');
  } catch (err) {
    assert.is(err.status, 404);
  }
});

test.run();
