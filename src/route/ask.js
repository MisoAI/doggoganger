import Router from '@koa/router';
import { handler, parseBodyIfNecessary } from './utils.js';

function getOptionsFromCtx(ctx) {
  const speedRate = Number(ctx.get('x-speed-rate')) || undefined;
  const answerFormat = ctx.get('x-answer-format') || undefined;
  const answerSampling = Number(ctx.get('x-answer-sampling')) || undefined;
  const answerLanguagesStr = ctx.get('x-answer-languages') || undefined;
  const answerLanguages = answerLanguagesStr ? answerLanguagesStr.split(',') : undefined;
  return { answerFormat, answerSampling, answerLanguages, speedRate };
}

export default function(api) {
  const router = new Router();

  router.post('/questions', (ctx) => {
    const payload = parseBodyIfNecessary(ctx.request.body);
    const data = api.ask.questions(payload, getOptionsFromCtx(ctx));
    ctx.body = JSON.stringify({ data });
  });

  router.get('/questions/:id/answer', (ctx) => {
    const { id } = ctx.params;
    const data = api.ask.answer(id);
    ctx.body = JSON.stringify({ data });
  });

  router.post('/related_questions', handler(api.ask.related_questions, 'query'));

  return router;
}
