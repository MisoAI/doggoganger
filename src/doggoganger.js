import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import serveStatic from 'koa-static';
import { koaBody } from 'koa-body';
import _route from './route/index.js';
import Api from './api/index.js';
import { exclusion } from './utils.js';

export default function doggoganger({ port = 9901, serve = false, ...options } = {}) {
  const app = new Koa();
  const router = new Router();
  const api = _route(new Api(options), options);
  
  router.use('/api', api.routes(), api.allowedMethods());
  router.use('/v1', api.routes(), api.allowedMethods());

  if (serve) {
    app
      .use(exclusion)
      .use(serveStatic('.'));
  }

  app
    .use(cors())
    .use(koaBody({
      formLimit: '100mb',
      textLimit: '100mb',
      jsonLimit: '100mb',
      onerror: function (err, ctx) {
        console.error(err);
        ctx.throw('body parse error', 422);
      },
    }))
    .use(handleAllPath(options))
    .use(router.routes())
    .use(router.allowedMethods())
    .use(handleUnrecognizedPath(options))
    .listen(port);
}

function handleAllPath({ verbose } = {}) {
  return async (ctx, next) => {
    verbose && console.log(`${ctx.method} ${ctx.url}`);
    await next();
  };
}

function handleUnrecognizedPath({ verbose } = {}) {
  return async (ctx, next) => {
    verbose && console.log(`Unrecognized path: ${ctx.method} ${ctx.url}`);
    await next();
  };
}
