import { responseFunction } from './route/utils.js';

export default async function fetch(api, url, { method = 'GET', body, seed } = {}) {
  method = method.toUpperCase();
  if (typeof body === 'string') {
    body = JSON.parse(body);
  }
  url = new URL(url);
  const segments = url.pathname.substring(1).split('/');
  if (segments[0] === 'v1') {
    segments.splice(0, 1);
  }
  const group = segments[0];
  let name = segments[1];
  let type = 'query';

  if (group === 'interactions' && segments.length === 1) {
    name = 'upload';
    type = 'data';
  } else if (group === 'ask' && segments.length === 4 && segments[1] === 'questions' && segments[3] === 'answer') {
    name = 'answer';
    body = segments[2];
  }

  if (!api[group][name]) {
    throw new Error(`Unknown path: ${url.pathname}`);
  }

  const fn = api[group][name].bind(api[group]);
  const response = responseFunction(type);
  const result = await fn(body, { seed });
  const resBody = response(result);

  return new Response(JSON.stringify(resBody), {
    status: 200,
  });
}
