import Router from '@koa/router';
import { handler } from './utils.js';

export default function(api) {
  const router = new Router();

  router.post('/search', handler((p, o) => api.search.search(p, o), 'query'));

  return router;
}
