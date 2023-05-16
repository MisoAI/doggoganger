import Router from '@koa/router';
import _answers from './answers.js';
import recommendation from './recommendation.js';
import search from './search.js';
import interactions from './interactions.js';

function use(router, path, middleware) {
  router.use(path, middleware.routes(), middleware.allowedMethods());
}

export default function(options) {
  const router = new Router();

  use(router, '/answers', _answers(options));
  use(router, '/recommendation', recommendation);
  use(router, '/search', search);
  use(router, '/interactions', interactions);

  return router;
};
