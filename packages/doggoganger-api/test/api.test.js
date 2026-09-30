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

test('me() jwt carries the current generation', () => {
  const a = api();
  assert.is(decode(a.me({ seed: SEED }).jwt.split('.')[1]).gen, 0);
  a.bumpGeneration();
  assert.is(decode(a.me({ seed: SEED }).jwt.split('.')[1]).gen, 1);
});

test('bumpGeneration() returns the new generation', () => {
  const a = api();
  assert.is(a.bumpGeneration(), 1);
  assert.is(a.bumpGeneration(), 2);
});

test('authorize() accepts a token of the current generation', () => {
  const a = api();
  a.bumpGeneration();
  a.authorize(`Bearer ${a.me().jwt}`);
});

test('authorize() rejects a token of a past generation with 401', () => {
  const a = api();
  const { jwt } = a.me();
  a.authorize(`Bearer ${jwt}`);
  a.bumpGeneration();
  try {
    a.authorize(`Bearer ${jwt}`);
    assert.unreachable('should have thrown');
  } catch (error) {
    assert.instance(error, Error);
    assert.is(error.status, 401);
  }
});

test('authorize() skips the check without a token', () => {
  const a = api();
  a.bumpGeneration();
  a.authorize(undefined);
  a.authorize('');
});

test('authorize() takes a token without generation as generation 0', () => {
  const a = api();
  a.authorize('Bearer 012345');
  a.bumpGeneration();
  assert.throws(() => a.authorize('Bearer 012345'), error => error.status === 401);
});

test.run();
