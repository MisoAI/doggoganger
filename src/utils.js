function shallServe(path) {
  if (path.startsWith('/node_modules/') || path.startsWith('.')) {
    return false;
  }
  const i = path.lastIndexOf('.');
  const ext = i < 0 ? path.substring(i + 1) : '';
  switch (ext) {
    case 'md':
      return false;
  }
  switch (path) {
    case 'package.json':
    case 'package-lock.json':
      return false;
  }
  return true;
}

export async function exclusion(ctx, next) {
  const { path } = ctx;
  if (shallServe(path)) {
    await next();
  } else {
    ctx.status = 404;
  }
}

export async function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}
