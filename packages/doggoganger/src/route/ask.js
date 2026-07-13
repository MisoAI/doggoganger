import { version } from '@miso.ai/lorem';
import Router from '@koa/router';
import { handler, parseBodyIfNecessary } from './utils.js';
import { delay, rollLatency } from '../utils.js';

function getOptionsFromCtx(ctx) {
  const seed = ctx.get('x-seed') || undefined;
  const speedRate = Number(ctx.get('x-speed-rate')) || undefined;
  const answerFormat = ctx.get('x-answer-format') || undefined;
  const answerSampling = Number(ctx.get('x-answer-sampling')) || undefined;
  const answerLanguagesStr = ctx.get('x-answer-languages') || undefined;
  const answerLanguages = answerLanguagesStr ? answerLanguagesStr.split(',') : undefined;
  return { seed, answerFormat, answerSampling, answerLanguages, speedRate };
}

const DEFAULT_LATENCY_OPTIONS = {
  min: 100,
  max: 5000,
};

export default function(api) {
  const router = new Router();

  router.post('/questions', async (ctx) => {
    const payload = parseBodyIfNecessary(ctx.request.body);
    const data = api.ask.questions(payload, getOptionsFromCtx(ctx));
    const time = rollLatency(DEFAULT_LATENCY_OPTIONS.min, DEFAULT_LATENCY_OPTIONS.max);
    await delay(time);
    ctx.body = JSON.stringify({ data, version });
  });

  router.get('/questions/:id/answer', async (ctx) => {
    const { id } = ctx.params;
    const data = api.ask.answer(id);
    const time = rollLatency(DEFAULT_LATENCY_OPTIONS.min, DEFAULT_LATENCY_OPTIONS.max);
    await delay(time);
    ctx.body = JSON.stringify({ data, version });
  });

  router.post('/search', async (ctx) => {
    const payload = parseBodyIfNecessary(ctx.request.body);
    const data = api.ask.search(payload, getOptionsFromCtx(ctx));
    const time = rollLatency(DEFAULT_LATENCY_OPTIONS.min, DEFAULT_LATENCY_OPTIONS.max);
    await delay(time);
    ctx.body = JSON.stringify({ data, version });
  });

  router.post('/related_questions', handler((p, o) => api.ask.related_questions(p, o), 'query'));

  router.post('/query_suggestion', handler((p, o) => api.ask.query_suggestion(p, o), 'query'));

  router.post('/autocomplete', handler((p, o) => api.ask.autocomplete(p, o), 'query'));

  router.post('/search_autocomplete', handler((p, o) => api.ask.search_autocomplete(p, o), 'query'));

  router.get('/user_history/threads', handler(() => api.ask.userHistory.threads(), 'query'));

  router.post('/user_history/threads/_delete', handler(p => api.ask.userHistory.deleteThreads(p), 'query'));

  router.post('/user_history/threads/_delete_all', handler(() => api.ask.userHistory.deleteAllThreads(), 'query'));

  router.get('/user_history/threads/:id', handler((p, o, ctx) => api.ask.userHistory.getThread(ctx.params.id), 'query'));

  router.put('/user_history/threads/:id', handler((p, o, ctx) => api.ask.userHistory.updateThread(ctx.params.id, p), 'query'));

  router.delete('/user_history/threads/:id', handler((p, o, ctx) => api.ask.userHistory.deleteThread(ctx.params.id), 'query'));

  return router;
}
