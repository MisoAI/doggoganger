
export function parseBodyIfNecessary(body) {
  if (typeof body === 'string') {
    return JSON.parse(body);
  }
  return body;
}

function getOptionsFromCtx(ctx) {
  const seed = ctx.get('x-seed') || undefined;
  return { seed };
}

export function handler(fn, response) {
  response = responseFunction(response);
  return async (ctx) => {
    try {
      const payload = parseBodyIfNecessary(ctx.request.body);
      const options = getOptionsFromCtx(ctx);
      const result = await fn(payload, options);
      ctx.body = response(result);
    } catch (error) {
      ctx.status = error.status || 500;
      ctx.body = {
        errors: true,
        message: error.message || '',
      };
    }
  };
}

export function responseFunction(response) {
  if (typeof response === 'function') {
    return response;
  }
  switch (response) {
    case 'query':
      return data => ({ data });
    case 'data':
      return data => ({ took: 5, errors: false, data });
    default:
      throw new Error(`Unknown response type: ${response}`);
  }
}
