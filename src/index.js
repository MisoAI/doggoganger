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
  const api = _route(new Api(options));
  
  router.use('/api', api.routes(), api.allowedMethods());

  if (serve) {
    app
      .use(exclusion)
      .use(serveStatic('.'));
  }

  app
    .use(cors())
    .use(koaBody())
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(port);
}
