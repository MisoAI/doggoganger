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
  assert.equal(Object.keys(entry).sort(), ['thread_id', 'title', 'updated_at', 'unread'].sort());
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

test('generateThreads creates the requested number of threads', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: 3 }, { seed: SEED });
  assert.is(ask.userHistory.threads().threads.length, 3);
});

test('generateThreads defaults to 3-6 threads', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({}, { seed: SEED });
  const { length } = ask.userHistory.threads().threads;
  assert.ok(length >= 3 && length <= 6, `expected 3-6 threads, got ${length}`);
});

test('generateThreads accepts rows as a [min, max] range', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: [2, 4] }, { seed: SEED });
  const { length } = ask.userHistory.threads().threads;
  assert.ok(length >= 2 && length <= 4, `expected 2-4 threads, got ${length}`);
});

test('generateThreads honors a numeric questionRows for every thread', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: 3, questionRows: 2 }, { seed: SEED });

  for (const { thread_id } of ask.userHistory.threads().threads) {
    assert.is(ask.userHistory.getThread(thread_id).questions_ids.length, 2);
  }
});

test('generateThreads accepts questionRows as a [min, max] range', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: 3, questionRows: [2, 5] }, { seed: SEED });

  for (const { thread_id } of ask.userHistory.threads().threads) {
    const { length } = ask.userHistory.getThread(thread_id).questions_ids;
    assert.ok(length >= 2 && length <= 5, `expected 2-5 questions, got ${length}`);
  }
});

test('generateThreads gives every thread a generated title', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: 3 }, { seed: SEED });

  for (const { title } of ask.userHistory.threads().threads) {
    assert.type(title, 'string');
    assert.ok(title.length > 0);
  }
});

test('generateThreads is deterministic with the same seed', () => {
  const ask1 = makeAsk();
  ask1.userHistory.generateThreads({ rows: 3 }, { seed: SEED });

  const ask2 = makeAsk();
  ask2.userHistory.generateThreads({ rows: 3 }, { seed: SEED });

  assert.equal(ask1.userHistory.threads(), ask2.userHistory.threads());
});

test('generateThreads differs across seeds', () => {
  const ask1 = makeAsk();
  ask1.userHistory.generateThreads({ rows: 3 }, { seed: SEED_A });

  const ask2 = makeAsk();
  ask2.userHistory.generateThreads({ rows: 3 }, { seed: SEED_B });

  const ids1 = ask1.userHistory.threads().threads.map(t => t.thread_id);
  const ids2 = ask2.userHistory.threads().threads.map(t => t.thread_id);
  assert.not.equal(ids1, ids2);
});

test('generateThreads chains questions into a single thread each', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: 3 }, { seed: SEED });

  for (const { thread_id } of ask.userHistory.threads().threads) {
    const { questions_ids } = ask.userHistory.getThread(thread_id);
    assert.ok(questions_ids.length >= 1 && questions_ids.length <= 10);
  }
});

test('generateThreads registers answerable questions', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: 2 }, { seed: SEED });

  for (const { thread_id } of ask.userHistory.threads().threads) {
    for (const question_id of ask.userHistory.getThread(thread_id).questions_ids) {
      const answer = ask.answer(question_id);
      assert.is(answer.question_id, question_id);
    }
  }
});

test('generateThreads works without a seed', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: 2 });
  assert.is(ask.userHistory.threads().threads.length, 2);
});

// Poll a question to completion and return its final answer text
function finishedAnswer(ask, question_id) {
  let result;
  for (let i = 0; i < 100; i++) {
    result = ask.answer(question_id);
    if (result.finished) break;
  }
  return result.answer;
}

function generatedAnswers(ask) {
  const answers = [];
  for (const { thread_id } of ask.userHistory.threads().threads) {
    for (const question_id of ask.userHistory.getThread(thread_id).questions_ids) {
      answers.push(finishedAnswer(ask, question_id));
    }
  }
  return answers;
}

// Linked citations render as [[3]](url), plain ones as [3]
const LINKED_CITATION = /\[\[\d+\]\]\(/;

test('generateThreads produces answers with linked citations by default', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: 2 }, { seed: SEED });

  const answers = generatedAnswers(ask);
  assert.ok(answers.length > 0);
  for (const answer of answers) {
    assert.ok(LINKED_CITATION.test(answer));
  }
});

test('generateThreads routes payload fields into generated questions', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: 2, payload: { cite_link: false } }, { seed: SEED });

  const answers = generatedAnswers(ask);
  assert.ok(answers.length > 0);
  for (const answer of answers) {
    assert.not.ok(LINKED_CITATION.test(answer));
    assert.ok(/\[\d+\]/.test(answer));
  }
});

test('threads created by asking questions start read', () => {
  const ask = makeAsk();
  ask.questions({ question: 'What is Miso?' }, { seed: SEED });

  const [entry] = ask.userHistory.threads().threads;
  assert.is(entry.unread, false);
});

test('generateThreads marks some threads unread', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: 4 }, { seed: SEED });

  const { threads } = ask.userHistory.threads();
  assert.ok(threads.some(t => t.unread === true));
  assert.ok(threads.some(t => t.unread === false));
});

test('markThreadAsRead clears the unread flag', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: 4 }, { seed: SEED });
  const { thread_id } = ask.userHistory.threads().threads.find(t => t.unread);

  const updated = ask.userHistory.markThreadAsRead(thread_id);
  assert.is(updated.unread, false);

  // Persisted for subsequent reads
  assert.is(ask.userHistory.getThread(thread_id).unread, false);
});

test('markThreadAsRead throws 404 for unknown thread_id', () => {
  const ask = makeAsk();
  try {
    ask.userHistory.markThreadAsRead('nonexistent-id');
    assert.unreachable('should have thrown');
  } catch (err) {
    assert.is(err.status, 404);
  }
});

test('notifications reports the unread badge state', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: 4 }, { seed: SEED });

  const unread = ask.userHistory.threads().threads.filter(t => t.unread);
  const { has_unread, unread_count, last_update_at } = ask.userHistory.notifications();
  assert.is(has_unread, true);
  assert.is(unread_count, unread.length);
  assert.ok(unread_count > 0);
  assert.ok(unread.some(t => t.updated_at === last_update_at));
});

test('notifications is empty without unread threads', () => {
  const ask = makeAsk();
  ask.questions({ question: 'What is Miso?' }, { seed: SEED });

  const { has_unread, unread_count, last_update_at } = ask.userHistory.notifications();
  assert.is(has_unread, false);
  assert.is(unread_count, 0);
  assert.is(last_update_at, undefined);
});

test('markThreadAsRead decrements unread_count', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: 4 }, { seed: SEED });
  const before = ask.userHistory.notifications();

  for (const { thread_id, unread } of ask.userHistory.threads().threads) {
    if (unread) {
      ask.userHistory.markThreadAsRead(thread_id);
      break;
    }
  }

  assert.is(ask.userHistory.notifications().unread_count, before.unread_count - 1);
});

test('marking all threads read clears has_unread', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: 4 }, { seed: SEED });

  for (const { thread_id, unread } of ask.userHistory.threads().threads) {
    if (unread) {
      ask.userHistory.markThreadAsRead(thread_id);
    }
  }

  const { has_unread, unread_count } = ask.userHistory.notifications();
  assert.is(has_unread, false);
  assert.is(unread_count, 0);
});

test('dismissNotifications hides the badge but keeps threads unread', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: 4 }, { seed: SEED });
  const before = ask.userHistory.notifications();

  ask.userHistory.dismissNotifications();

  const after = ask.userHistory.notifications();
  assert.is(after.has_unread, false);
  assert.is(after.unread_count, before.unread_count);
  assert.ok(ask.userHistory.threads().threads.some(t => t.unread));
});

test('activity newer than the dismissal raises the badge again', () => {
  const ask = makeAsk();
  ask.userHistory.generateThreads({ rows: 4 }, { seed: SEED });
  ask.userHistory.dismissNotifications();
  assert.is(ask.userHistory.notifications().has_unread, false);

  // Simulate later server-side activity on an unread thread
  const entry = ask.userHistory.threads().threads.find(t => t.unread);
  ask.userHistory._getThread(entry.thread_id).updated_at = '2026-02-01T00:00:00.000';

  assert.is(ask.userHistory.notifications().has_unread, true);
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
