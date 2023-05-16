import Router from '@koa/router';
import { v4 as uuid } from 'uuid';
import { lorem, md, articles, utils } from '../data/index.js';

const { randomInt } = utils;

const CPS = 100;
const ITEMS_LOADING_TIME = 3;
const STAGES = [
  {
    name: 'fetch',
    duration: 1.5,
    text: `Checking the question and fetching results...`,
  },
  {
    name: 'verify',
    duration: 1.5,
    text: `Verifying results...`,
  },
  {
    name: 'generate',
    duration: 1.5,
    text: `Generating answer...`,
  },
];

function formatDatetime(timestamp) {
  const str = new Date(timestamp).toISOString();
  return str.endsWith('Z') ? str.slice(0, -1) : str;
}

function answer(format) {
  switch (format) {
    case 'markdown':
      return md.markdown({});
    case 'plaintext':
    default:
      return lorem.lorem({
        min: 50,
        max: 100,
        decorates: ['description'],
      });
  }
}

const answers = new Map();

class Answer {

  constructor(question, previous_question_id, { answerFormat = 'plaintext' } = {}) {
    this.question_id = uuid();
    this.question = question;
    this.previous_answer_id = previous_question_id;
    this.timestamp = Date.now();
    this.datetime = formatDatetime(this.timestamp);

    this.answer = answer(answerFormat);
    this.relatedResources = [...articles({ rows: randomInt(6, 8) })];
    this.sources = [...articles({ rows: randomInt(4, 6) })];

    this.previous_question_id = previous_question_id && answers.get(previous_question_id) || undefined;
    answers.set(this.question_id, this);
  }

  get() {
    const now = Date.now();
    const elapsed = (now - this.timestamp) / 1000;
    const [stage, answer, finished] = this._answer(elapsed);
    const sources = this._sources(elapsed);
    const related_resources = this._relatedResources(elapsed);
    const { question_id, question, datetime, previous_question_id } = this;

    return {
      affiliation: undefined,
      stage,
      answer,
      datetime,
      finished,
      previous_question_id,
      question,
      question_id,
      related_resources,
      sources,
    };
  }

  _answer(elapsed) {
    for (const stage of STAGES) {
      elapsed -= stage.duration;
      if (elapsed < 0) {
        return [stage.name, stage.text, false];
      }
    }
    const length = Math.floor(elapsed * CPS);
    const finished = length >= this.answer.length;
    const text = finished ? this.answer : this.answer.slice(0, length);
    return ['result', text, finished];
  }

  _sources(elapsed) {
    const { sources } = this;
    const { length } = sources;
    const loaded = Math.floor(length * elapsed / ITEMS_LOADING_TIME);
    return sources.slice(0, loaded);
  }

  _relatedResources(elapsed) {
    const { relatedResources } = this;
    const { length } = relatedResources;
    const loaded = Math.floor(length * elapsed / ITEMS_LOADING_TIME);
    return relatedResources.slice(0, loaded);
  }

}

export default function({ answerFormat }) {
  const options = Object.freeze({ answerFormat });
  const router = new Router();

  router.post('/questions', (ctx) => {
    const { q: question, previous_answer_id } = JSON.parse(ctx.request.body);
    const answerFormat = ctx.get('x-answer-format') || options.answerFormat;
    const answer = new Answer(question, previous_answer_id, { answerFormat });
    const data = answer.get();
    ctx.body = JSON.stringify({ data });
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
