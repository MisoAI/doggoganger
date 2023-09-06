export function parseBodyIfNecessary(body) {
  if (typeof body === 'string') {
    return JSON.parse(body);
  }
  return body;
}

export function handler(fn, response) {
  fn = wrapResponse(fn, response);
  return async (ctx) => {
    try {
      ctx.body = await fn(parseBodyIfNecessary(ctx.request.body));
    } catch (error) {
      ctx.status = error.status || 500;
      ctx.body = {
        errors: true,
        message: error.message || '',
      };
    }
  };
}

export function wrapResponse(fn, response) {
  response = responseFunction(response);
  return async (payload) => {
    try {
      return response(await fn(payload));
    } catch (error) {
      error.status = error.status || 500;
      error.data = {
        errors: true,
        message: error.message,
      };
      throw error;
    }
  };
}

export function responseFunction(response) {
  if (typeof response === 'function') {
    return response;
  }
  switch (response) {
    case 'query':
      // TODO: miso_id
      return data => ({ data });
    case 'data':
      return data => ({ took: 5, errors: false, data });
    default:
      throw new Error(`Unknown response type: ${response}`);
  }
}
