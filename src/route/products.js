import Router from '@koa/router';
import { handler } from './utils.js';

export default function(api) {
  const router = new Router();

  router.post('/', handler(api.products.upload, 'data'));
  router.post('_delete', handler(api.products.batchDelete, 'data'));

  router.get('/_ids', (ctx) => {
    ctx.body = {
      message: 'success',
      data: api.products.ids(),
    };
  });

  router.get('/_status/:taskId', (ctx) => {
    ctx.body = {
      took: 100,
      errors: false,
      data: [],
      code: 200,
    };
  });

  return router;
}
