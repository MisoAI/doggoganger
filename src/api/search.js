import Router from '@koa/router';
import { products } from './handlers.js';

const router = new Router();

router.post('/search', products);

export default router;
