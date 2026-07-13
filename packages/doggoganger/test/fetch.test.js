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

test.run();
