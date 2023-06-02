import Router from '@koa/router';
import { parseBodyIfNecessary } from './utils.js';

function getOptionsFromCtx(ctx) {
  const speedRate = Number(ctx.get('x-speed-rate')) || undefined;
  const answerFormat = ctx.get('x-answer-format') || undefined;
  const answerSampling = Number(ctx.get('x-answer-sampling')) || undefined;
  const answerLanguagesStr = ctx.get('x-answer-languages') || undefined;
  const answerLanguages = answerLanguagesStr ? answerLanguagesStr.split(',') : undefined;
  return { answerFormat, answerSampling, answerLanguages, speedRate };
}

export default function(api) {
  const answers = new Map();
  const router = new Router();

  router.post('/questions', (ctx) => {
    const { question, parent_question_id } = parseBodyIfNecessary(ctx.request.body);
    const answer = api.ask.questions({ question, parent_question_id }, getOptionsFromCtx(ctx));
    const { question_id } = answer;
    answers.set(question_id, answer);
    ctx.body = JSON.stringify({ data: { question_id } });
  });

  router.get('/questions/:id/answer', (ctx) => {
    const { id } = ctx.params;
    const answer = answers.get(id);
    if (!answer) {
      ctx.status = 404;
    } else {
      const data = answer.get();
      ctx.body = JSON.stringify({ data });
    }
  });

  return router;
}
