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
  let apiNode = api[group];
  let name = segments[1];
  let args = [body];
  let type = 'query';

  if (group === 'interactions' && segments.length === 1) {
    name = 'upload';
    type = 'data';
  } else if (group === 'ask' && segments.length === 4 && segments[1] === 'questions' && segments[3] === 'answer') {
    name = 'answer';
    args = [segments[2]];
  } else if (group === 'ask' && segments[1] === 'user_history') {
    // The resource-style API is not released yet, so it keeps its own subtree
    // under /threads and /notifications; everything else is the current API.
    const resolve = segments[2] === 'threads' || segments[2] === 'notifications' ?
      resolveUserHistory : resolveUserHistoryV0;
    ({ apiNode, name, args } = resolve(api, method, segments, body));
  }

  if (!apiNode || typeof apiNode[name] !== 'function') {
    throw new Error(`Unknown path: ${method} ${url.pathname}`);
  }

  const response = responseFunction(type);
  const result = await apiNode[name](...args, { seed });
  const resBody = response(result);

  return new Response(JSON.stringify(resBody), {
    status: 200,
  });
}

// Resolves /ask/user_history/... paths to a userHistoryV0 method, following the
// user history API in production today.
// @see https://miso-docs.apidocumentation.com/api/genai/user-history
function resolveUserHistoryV0(api, method, segments, body) {
  const apiNode = api.ask.userHistoryV0;
  const args = [body];
  const [, , sub, ...rest] = segments;
  switch (sub) {
    case 'list':
      return { apiNode, name: 'threads', args };
    case 'delete':
      return { apiNode, name: 'deleteThreads', args };
    case 'delete_all':
      return { apiNode, name: 'deleteAllThreads', args };
    case 'thread':
      break;
    default:
      return { apiNode, name: undefined, args };
  }
  switch (rest[0]) {
    case undefined:
      return { apiNode, name: 'openThread', args };
    case 'rename':
      return { apiNode, name: 'renameThread', args };
    case 'updates':
      break;
    default:
      return { apiNode, name: undefined, args };
  }
  switch (rest[1]) {
    case undefined:
      return { apiNode, name: 'updates', args };
    case 'subscribe':
      return { apiNode, name: 'subscribe', args };
    case 'unsubscribe':
      return { apiNode, name: 'unsubscribe', args };
    case 'dismiss_thread':
      return { apiNode, name: 'dismissThread', args };
    case 'dismiss_overall':
      return { apiNode, name: 'dismissOverall', args };
    case 'touch':
      return { apiNode, name: 'touchThread', args };
    default:
      return { apiNode, name: undefined, args };
  }
}

// Resolves /ask/user_history/... paths to a userHistory method, following the
// resource-style API that is not released yet.
function resolveUserHistory(api, method, segments, body) {
  const apiNode = api.ask.userHistory;
  if (segments[2] === 'notifications') {
    return segments[3] === 'dismiss' ?
      { apiNode, name: 'dismissNotifications', args: [] } :
      { apiNode, name: 'notifications', args: [] };
  }
  if (segments[2] !== 'threads') {
    return { apiNode, name: undefined, args: [] };
  }
  const sub = segments[3];
  switch (sub) {
    case undefined:
      return { apiNode, name: 'threads', args: [] };
    case '_delete':
      return { apiNode, name: 'deleteThreads', args: [body] };
    case '_delete_all':
      return { apiNode, name: 'deleteAllThreads', args: [] };
  }
  if (segments[4] === 'read') {
    return { apiNode, name: 'markThreadAsRead', args: [sub] };
  }
  switch (method) {
    case 'GET':
      return { apiNode, name: 'getThread', args: [sub] };
    case 'PUT':
      return { apiNode, name: 'updateThread', args: [sub, body] };
    case 'DELETE':
      return { apiNode, name: 'deleteThread', args: [sub] };
    default:
      return { apiNode, name: undefined, args: [] };
  }
}
