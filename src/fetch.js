import { wrapResponse } from './route/utils.js';

export default function buildFetch(api) {
  return async function fetch(url, { method = 'GET', body } = {}) {
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
    } else if (group === 'ask' && segments.length === 4 && segments[2] === 'questions' && segments[3] === 'answer') {
      name = 'answer';
      body = segments[3];
    }

    if (!api[group][name]) {
      throw new Error(`Unknown path: ${url.pathname}`);
    }

    return await wrapResponse(api[group][name], type)(body);
  };
}
