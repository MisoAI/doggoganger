import Router from '@koa/router';
import ask from './ask.js';
import recommendation from './recommendation.js';
import search from './search.js';
import interactions from './interactions.js';

function use(router, path, middleware) {
  router.use(path, middleware.routes(), middleware.allowedMethods());
}

export default function(api) {
  const router = new Router();

  use(router, '/ask', ask(api));
  use(router, '/recommendation', recommendation(api));
  use(router, '/search', search(api));
  use(router, '/interactions', interactions);

  return router;
};
