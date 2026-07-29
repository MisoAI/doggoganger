import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { api } from '../lib/index.js';

const SEED = 42;
const TIMESTAMP = Date.UTC(2026, 0, 1);

function decode(segment) {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
}

test('me() returns an object with a jwt string', () => {
  const { jwt } = api().me();
  assert.type(jwt, 'string');
  assert.is(jwt.split('.').length, 3);
});

test('me() jwt has a decodable HS256 header', () => {
  const { jwt } = api().me({ seed: SEED });
  assert.equal(decode(jwt.split('.')[0]), { alg: 'HS256', typ: 'JWT' });
});

test('me() jwt carries user claims', () => {
  const { jwt } = api().me({ seed: SEED, timestamp: TIMESTAMP });
  const claims = decode(jwt.split('.')[1]);

  assert.is(claims.iss, 'doggoganger');
  assert.type(claims.sub, 'string');
  assert.type(claims.name, 'string');
  assert.is(claims.email, `${claims.name.toLowerCase().replace(/\s+/g, '.')}@example.com`);
  assert.is(claims.iat, TIMESTAMP / 1000);
  assert.is(claims.exp, TIMESTAMP / 1000 + 3600);
});

test('me() jwt is unpadded base64url', () => {
  const { jwt } = api().me({ seed: SEED, timestamp: TIMESTAMP });
  assert.ok(/^[\w-]+\.[\w-]+\.[\w-]+$/.test(jwt), jwt);
});

test('me() signature is 32 bytes, as HS256 would be', () => {
  const { jwt } = api().me({ seed: SEED, timestamp: TIMESTAMP });
  assert.is(Buffer.from(jwt.split('.')[2], 'base64url').length, 32);
});

test('me() is deterministic for a given seed and timestamp', () => {
  const a = api().me({ seed: SEED, timestamp: TIMESTAMP });
  const b = api().me({ seed: SEED, timestamp: TIMESTAMP });
  assert.is(a.jwt, b.jwt);
});

test('me() varies by seed', () => {
  const a = api().me({ seed: 1, timestamp: TIMESTAMP });
  const b = api().me({ seed: 2, timestamp: TIMESTAMP });
  assert.is.not(a.jwt, b.jwt);
  assert.is.not(decode(a.jwt.split('.')[1]).sub, decode(b.jwt.split('.')[1]).sub);
});

test.run();
