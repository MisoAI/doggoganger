import { test } from 'uvu';
import * as assert from 'uvu/assert';
import buildApi from '../src/api.js';
import fetch from '../src/fetch.js';

const SEED = 42;
const BASE_URL = 'http://doggoganger';

test('POST /ask/questions returns a question_id', async () => {
  const api = buildApi({ temporal: false });
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
  const api1 = buildApi({ temporal: false });
  const api2 = buildApi({ temporal: false });

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
  const api1 = buildApi({ temporal: false });
  const api2 = buildApi({ temporal: false });

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
  const api = buildApi({ temporal: false });
  const res = await fetch(api, `${BASE_URL}/ask/questions`, {
    method: 'POST',
    body: JSON.stringify({ q: 'What is Miso?' }),
    seed: SEED,
  });

  assert.is(res.status, 200);
  const { data } = await res.json();
  assert.ok(data.question_id);
});

test.run();
