import { test } from 'uvu';
import * as assert from 'uvu/assert';
import buildApi from '../src/api.js';
import fetch from '../src/fetch.js';

const SEED = 42;
const BASE_URL = 'http://doggoganger';

test('POST /ask/questions returns a question_id', async () => {
  const api = buildApi({ detemporize: true });
  const res = await fetch(api, `${BASE_URL}/ask/questions`, {
    method: 'POST',
    body: { q: 'What is Miso?' },
    seed: SEED,
  });

  assert.is(res.status, 200);

  const { data, version } = await res.json();
  assert.ok(data.question_id, 'question_id should be present');
  assert.type(data.question_id, 'string');
  assert.type(version, 'string');
});

test('POST /ask/questions with same seed returns same question_id', async () => {
  const api1 = buildApi({ detemporize: true });
  const api2 = buildApi({ detemporize: true });

  const res1 = await fetch(api1, `${BASE_URL}/ask/questions`, {
    method: 'POST',
    body: { q: 'What is Miso?' },
    seed: SEED,
  });
  const res2 = await fetch(api2, `${BASE_URL}/ask/questions`, {
    method: 'POST',
    body: { q: 'What is Miso?' },
    seed: SEED,
  });

  const { data: data1 } = await res1.json();
  const { data: data2 } = await res2.json();

  assert.is(data1.question_id, data2.question_id);
});

test('POST /ask/questions with different seeds returns different question_ids', async () => {
  const api1 = buildApi({ detemporize: true });
  const api2 = buildApi({ detemporize: true });

  const res1 = await fetch(api1, `${BASE_URL}/ask/questions`, {
    method: 'POST',
    body: { q: 'What is Miso?' },
    seed: SEED,
  });
  const res2 = await fetch(api2, `${BASE_URL}/ask/questions`, {
    method: 'POST',
    body: { q: 'What is Miso?' },
    seed: SEED + 1,
  });

  const { data: data1 } = await res1.json();
  const { data: data2 } = await res2.json();

  assert.is.not(data1.question_id, data2.question_id);
});

test('POST /ask/questions accepts JSON string body', async () => {
  const api = buildApi({ detemporize: true });
  const res = await fetch(api, `${BASE_URL}/ask/questions`, {
    method: 'POST',
    body: JSON.stringify({ q: 'What is Miso?' }),
    seed: SEED,
  });

  assert.is(res.status, 200);
  const { data } = await res.json();
  assert.ok(data.question_id);
});

// The user history API in production today
// @see https://miso-docs.apidocumentation.com/api/genai/user-history

async function post(api, path, body, seed) {
  return await (await fetch(api, `${BASE_URL}${path}`, { method: 'POST', body, seed })).json();
}

async function askTwoQuestions(api) {
  const { data: first } = await post(api, '/ask/questions', { question: 'First' }, 1);
  const { data: second } = await post(api, '/ask/questions', { question: 'Second' }, 2);
  return [first.question_id, second.question_id];
}

test('POST /v1/ask/user_history/list lists threads newest first', async () => {
  const api = buildApi({ detemporize: true });
  const [, second] = await askTwoQuestions(api);

  const res = await fetch(api, `${BASE_URL}/v1/ask/user_history/list`, { method: 'POST', body: { user_id: 'u1' } });
  assert.is(res.status, 200);

  const { data } = await res.json();
  assert.equal(data.threads.map(t => t.title), ['Second', 'First']);
  assert.is(data.threads[0].id, second);
  assert.is(data.threads[0].question_id, second);
  assert.type(data.threads[0].time, 'string');
  assert.is(data.has_more, false);
  assert.is(data.start, 0);
  assert.is(data.rows, 100);
});

test('POST /ask/user_history/list pages with rows and start', async () => {
  const api = buildApi({ detemporize: true });
  await askTwoQuestions(api);

  const { data } = await post(api, '/ask/user_history/list', { user_id: 'u1', rows: 1 });
  assert.equal(data.threads.map(t => t.title), ['Second']);
  assert.is(data.has_more, true);

  const { data: next } = await post(api, '/ask/user_history/list', { user_id: 'u1', rows: 1, start: 1 });
  assert.equal(next.threads.map(t => t.title), ['First']);
  assert.is(next.has_more, false);
});

test('POST /ask/user_history/thread opens a thread', async () => {
  const api = buildApi({ detemporize: true });
  const { data: root } = await post(api, '/ask/questions', { question: 'Root' });
  const { data: child } = await post(api, '/ask/questions', { question: 'Follow up', parent_question_id: root.question_id });

  const { data } = await post(api, '/ask/user_history/thread', { thread_id: root.question_id });
  assert.equal(data, { question_ids: [root.question_id, child.question_id], has_more: false });
});

test('POST /ask/user_history/thread/rename renames a thread', async () => {
  const api = buildApi({ detemporize: true });
  const { data: q } = await post(api, '/ask/questions', { question: 'Old' });

  const res = await fetch(api, `${BASE_URL}/ask/user_history/thread/rename`, {
    method: 'POST',
    body: { thread_id: q.question_id, user_id: 'u1', title: 'New' },
  });
  assert.is(res.status, 200);
  const { data: renamed } = await res.json();
  assert.equal(renamed, { question_id: q.question_id, title: 'New' });

  const { data } = await post(api, '/ask/user_history/list', { user_id: 'u1' });
  assert.equal(data.threads.map(t => t.title), ['New']);
});

test('POST /ask/user_history/delete removes the listed threads', async () => {
  const api = buildApi({ detemporize: true });
  const [first, second] = await askTwoQuestions(api);

  const { data } = await post(api, '/ask/user_history/delete', { question_ids: [first], user_id: 'u1' });
  assert.equal(data, { deleted_count: 1 });

  const { data: after } = await post(api, '/ask/user_history/list', { user_id: 'u1' });
  assert.equal(after.threads.map(t => t.id), [second]);
});

test('POST /ask/user_history/delete_all clears everything', async () => {
  const api = buildApi({ detemporize: true });
  await askTwoQuestions(api);

  await post(api, '/ask/user_history/delete_all', { user_id: 'u1' });

  const { data } = await post(api, '/ask/user_history/list', { user_id: 'u1' });
  assert.equal(data.threads, []);
});

test('POST /ask/user_history/thread/updates polls the account indicator', async () => {
  const api = buildApi({ detemporize: true });
  api.ask.userHistory.generateThreads({ rows: 4 }, { seed: SEED });

  const { data } = await post(api, '/ask/user_history/thread/updates', { user_id: 'u1' });
  assert.equal(data, { has_new: true });
});

test('POST /ask/user_history/thread/updates/dismiss_overall hides the indicator', async () => {
  const api = buildApi({ detemporize: true });
  api.ask.userHistory.generateThreads({ rows: 4 }, { seed: SEED });

  await post(api, '/ask/user_history/thread/updates/dismiss_overall', { user_id: 'u1' });

  const { data } = await post(api, '/ask/user_history/thread/updates', { user_id: 'u1' });
  assert.equal(data, { has_new: false });
});

test('POST /ask/user_history/thread/updates/dismiss_thread clears one thread', async () => {
  const api = buildApi({ detemporize: true });
  api.ask.userHistory.generateThreads({ rows: 4 }, { seed: SEED });
  const { data: list } = await post(api, '/ask/user_history/list', { user_id: 'u1' });
  const { id } = list.threads.find(t => t.has_new);

  await post(api, '/ask/user_history/thread/updates/dismiss_thread', { user_id: 'u1', thread_id: id });

  const { data: after } = await post(api, '/ask/user_history/list', { user_id: 'u1' });
  assert.is(after.threads.find(t => t.id === id).has_new, false);
});

test('POST /ask/user_history/thread/updates/(un)subscribe succeed without changing the subscription', async () => {
  const api = buildApi({ detemporize: true });
  const { data: q } = await post(api, '/ask/questions', { question: 'First' });

  const res = await post(api, '/ask/user_history/thread/updates/unsubscribe', { user_id: 'u1', thread_id: q.question_id });
  assert.is(res.message, 'success');
  let { data } = await post(api, '/ask/user_history/list', { user_id: 'u1' });
  assert.is(data.threads[0].subscribed, true);

  await post(api, '/ask/user_history/thread/updates/subscribe', { user_id: 'u1', thread_id: q.question_id });
  ({ data } = await post(api, '/ask/user_history/list', { user_id: 'u1' }));
  assert.is(data.threads[0].subscribed, true);
});

test('POST /ask/user_history/thread/updates/touch generates an update', async () => {
  const api = buildApi({ detemporize: true });
  const { data: q } = await post(api, '/ask/questions', { question: 'Root' });

  const { data } = await post(api, '/ask/user_history/thread/updates/touch', { thread_id: q.question_id, generate: true });
  assert.is(data.generated, true);
  assert.is(data.touched, 1);
  assert.ok(data.question_id);

  const { data: thread } = await post(api, '/ask/user_history/thread', { thread_id: q.question_id });
  assert.equal(thread.question_ids, [q.question_id, data.question_id]);
});

test('POST /ask/answers returns the answers of the given questions', async () => {
  const api = buildApi({ detemporize: true });
  const [first, second] = await askTwoQuestions(api);

  const { data } = await post(api, '/ask/answers', { question_ids: [first, second] });
  assert.equal(data.map(a => a.question_id), [first, second]);
});

test('POST /ask/answers returns null for unknown question ids', async () => {
  const api = buildApi({ detemporize: true });
  const [first] = await askTwoQuestions(api);

  const { data } = await post(api, '/ask/answers', { question_ids: [first, 'nonexistent-id'] });
  assert.is(data[0].question_id, first);
  assert.is(data[1], null);
});

test('unknown user history paths are rejected', async () => {
  const api = buildApi({ detemporize: true });
  try {
    await fetch(api, `${BASE_URL}/ask/user_history/nonexistent`, { method: 'POST' });
    assert.unreachable('should have thrown');
  } catch (error) {
    assert.match(error.message, 'Unknown path');
  }
});

// The resource-style API, not released yet

test('GET /ask/user_history/threads lists created threads', async () => {
  const api = buildApi({ detemporize: true });
  await fetch(api, `${BASE_URL}/ask/questions`, { method: 'POST', body: { question: 'First' }, seed: 1 });
  await fetch(api, `${BASE_URL}/ask/questions`, { method: 'POST', body: { question: 'Second' }, seed: 2 });

  const res = await fetch(api, `${BASE_URL}/ask/user_history/threads`);
  assert.is(res.status, 200);

  const { data } = await res.json();
  assert.is(data.threads.length, 2);
  assert.equal(data.threads.map(t => t.title), ['First', 'Second']);
  assert.is(data.threads[0].questions_ids, undefined);
});

test('GET /ask/user_history/threads/:id returns the full thread', async () => {
  const api = buildApi({ detemporize: true });
  const q = await (await fetch(api, `${BASE_URL}/ask/questions`, { method: 'POST', body: { question: 'First' }, seed: 1 })).json();
  const list = await (await fetch(api, `${BASE_URL}/ask/user_history/threads`)).json();
  const { thread_id } = list.data.threads[0];

  const res = await fetch(api, `${BASE_URL}/ask/user_history/threads/${thread_id}`);
  const { data } = await res.json();
  assert.is(data.thread_id, thread_id);
  assert.is(data.title, 'First');
  assert.equal(data.questions_ids, [q.data.question_id]);
});

test('PUT /ask/user_history/threads/:id updates the title', async () => {
  const api = buildApi({ detemporize: true });
  await fetch(api, `${BASE_URL}/ask/questions`, { method: 'POST', body: { question: 'Old' }, seed: 1 });
  const list = await (await fetch(api, `${BASE_URL}/ask/user_history/threads`)).json();
  const { thread_id } = list.data.threads[0];

  const res = await fetch(api, `${BASE_URL}/ask/user_history/threads/${thread_id}`, { method: 'PUT', body: { title: 'New' } });
  const { data } = await res.json();
  assert.is(data.title, 'New');

  const after = await (await fetch(api, `${BASE_URL}/ask/user_history/threads/${thread_id}`)).json();
  assert.is(after.data.title, 'New');
});

test('DELETE /ask/user_history/threads/:id removes the thread', async () => {
  const api = buildApi({ detemporize: true });
  await fetch(api, `${BASE_URL}/ask/questions`, { method: 'POST', body: { question: 'First' }, seed: 1 });
  const list = await (await fetch(api, `${BASE_URL}/ask/user_history/threads`)).json();
  const { thread_id } = list.data.threads[0];

  await fetch(api, `${BASE_URL}/ask/user_history/threads/${thread_id}`, { method: 'DELETE' });

  const after = await (await fetch(api, `${BASE_URL}/ask/user_history/threads`)).json();
  assert.is(after.data.threads.length, 0);
});

test('POST /ask/user_history/threads/_delete removes listed threads', async () => {
  const api = buildApi({ detemporize: true });
  await fetch(api, `${BASE_URL}/ask/questions`, { method: 'POST', body: { question: 'First' }, seed: 1 });
  await fetch(api, `${BASE_URL}/ask/questions`, { method: 'POST', body: { question: 'Second' }, seed: 2 });
  const list = await (await fetch(api, `${BASE_URL}/ask/user_history/threads`)).json();
  const [a, b] = list.data.threads;

  await fetch(api, `${BASE_URL}/ask/user_history/threads/_delete`, { method: 'POST', body: { thread_ids: [a.thread_id] } });

  const after = await (await fetch(api, `${BASE_URL}/ask/user_history/threads`)).json();
  assert.is(after.data.threads.length, 1);
  assert.is(after.data.threads[0].thread_id, b.thread_id);
});

test('POST /ask/user_history/threads/_delete_all clears everything', async () => {
  const api = buildApi({ detemporize: true });
  await fetch(api, `${BASE_URL}/ask/questions`, { method: 'POST', body: { question: 'First' }, seed: 1 });
  await fetch(api, `${BASE_URL}/ask/questions`, { method: 'POST', body: { question: 'Second' }, seed: 2 });

  await fetch(api, `${BASE_URL}/ask/user_history/threads/_delete_all`, { method: 'POST' });

  const after = await (await fetch(api, `${BASE_URL}/ask/user_history/threads`)).json();
  assert.is(after.data.threads.length, 0);
});

test('POST /ask/user_history/threads/:id/read marks the thread read', async () => {
  const api = buildApi({ detemporize: true });
  api.ask.userHistory.generateThreads({ rows: 4 }, { seed: SEED });
  const list = await (await fetch(api, `${BASE_URL}/ask/user_history/threads`)).json();
  const { thread_id } = list.data.threads.find(t => t.has_new);

  const res = await fetch(api, `${BASE_URL}/ask/user_history/threads/${thread_id}/read`, { method: 'POST' });
  assert.is(res.status, 200);
  const { data } = await res.json();
  assert.is(data.has_new, false);

  const after = await (await fetch(api, `${BASE_URL}/ask/user_history/threads/${thread_id}`)).json();
  assert.is(after.data.has_new, false);
});

test('GET /ask/user_history/notifications reports the unread badge state', async () => {
  const api = buildApi({ detemporize: true });
  api.ask.userHistory.generateThreads({ rows: 4 }, { seed: SEED });

  const res = await fetch(api, `${BASE_URL}/ask/user_history/notifications`);
  assert.is(res.status, 200);

  const { data } = await res.json();
  assert.is(data.has_new, true);
  assert.ok(data.unread_count > 0);
  assert.type(data.last_update_at, 'string');
});

test('POST /ask/user_history/notifications/dismiss hides the badge', async () => {
  const api = buildApi({ detemporize: true });
  api.ask.userHistory.generateThreads({ rows: 4 }, { seed: SEED });

  const res = await fetch(api, `${BASE_URL}/ask/user_history/notifications/dismiss`, { method: 'POST' });
  assert.is(res.status, 200);

  const { data } = await (await fetch(api, `${BASE_URL}/ask/user_history/notifications`)).json();
  assert.is(data.has_new, false);
  assert.ok(data.unread_count > 0);
});

test.run();
