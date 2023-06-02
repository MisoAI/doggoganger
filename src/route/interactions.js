import Router from '@koa/router';

const router = new Router();

router.post('/', (ctx) => {
  ctx.body = { took: 1, errors: false, data: [] };
});

export default router;
