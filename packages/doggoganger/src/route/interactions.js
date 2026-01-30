import Router from '@koa/router';
import { handler } from './utils.js';

export default function(api) {
  const router = new Router();

  router.post('/', handler((p, o) => api.interactions.upload(p, o), 'data'));

  return router;
}
