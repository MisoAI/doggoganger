import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import serveStatic from 'koa-static';
import { koaBody } from 'koa-body';
import api from './api/index.js';
import { exclusion } from './utils.js';

export default function doggoganger({ port = 9901, serve = false } = {}) {
  const app = new Koa();
  const router = new Router();
  
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
