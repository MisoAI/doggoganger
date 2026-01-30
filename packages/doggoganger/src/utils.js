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

export function trimObj(obj) {
  if (typeof obj !== 'object') {
    return obj;
  }
  const trimmed = {};
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined) {
      trimmed[k] = obj[k];
    }
  }
  return trimmed;
}

// Box-Muller transform for Gaussian distribution
function randomGauss() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function rollLatency(min, max) {
  return (min + max) / 2 + randomGauss() * (max - min) / 6;
}
