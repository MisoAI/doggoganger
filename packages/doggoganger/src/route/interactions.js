import Router from '@koa/router';
import { handler } from './utils.js';

export default function(api) {
  const router = new Router();

  router.post('/', handler(api.interactions.upload, 'data'));

  return router;
}
