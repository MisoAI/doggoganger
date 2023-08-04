import Router from '@koa/router';
import ask from './ask.js';
import recommendation from './recommendation.js';
import search from './search.js';
import interactions from './interactions.js';
import products from './products.js';
import { latency, error } from '../middleware/index.js';

function use(router, path, middleware) {
  router.use(path, middleware.routes(), middleware.allowedMethods());
}

export default function(api, options) {
  const router = new Router();

  router.use(latency(options.latency));
  //router.use(error(options.error));

  use(router, '/ask', ask(api));
  use(router, '/recommendation', recommendation(api));
  use(router, '/search', search(api));
  use(router, '/interactions', interactions(api));
  use(router, '/products', products(api));

  return router;
};
