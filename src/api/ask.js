import Router from '@koa/router';
import { v4 as uuid } from 'uuid';
import { lorem, md, articles, utils } from '../data/index.js';
import { parseBodyIfNecessary } from './utils.js';

const { randomInt } = utils;

const CPS = 100;
const ITEMS_LOADING_TIME = 3;
const STAGES = [
  {
    name: 'fetch',
    duration: 1.5,
    text: `Checking the question and fetching results... `,
  },
  {
    name: 'verify',
    duration: 1.5,
    text: `Verifying results... `,
  },
  {
    name: 'generate',
    duration: 1.5,
    text: `Generating answer... `,
  },
];

function formatDatetime(timestamp) {
  const str = new Date(timestamp).toISOString();
  return str.endsWith('Z') ? str.slice(0, -1) : str;
}

function sample(size, sampling) {
  return sampling !== undefined ? Math.ceil(size * sampling) : size;
}

function answer({ format, sampling }) {
  switch (format) {
    case 'markdown':
      return md.markdown({ sampling });
    case 'plaintext':
    default:
      return lorem.lorem({
        min: sample(50, sampling),
        max: sample(50, sampling),
        decorates: ['description'],
      });
  }
}

const answers = new Map();

class Answer {

  constructor(question, previous_question_id, { answerFormat = 'markdown', answerSampling, ...options } = {}) {
    this._options = Object.freeze(options);
    this.question_id = uuid();
    this.question = question;
    this.previous_answer_id = previous_question_id;
    this.timestamp = Date.now();
    this.datetime = formatDatetime(this.timestamp);

    const sampling = answerSampling !== undefined ? Math.max(0, Math.min(1, answerSampling)) : undefined;

    this.answer = answer({ format: answerFormat, sampling });
    this.relatedResources = [...articles({ rows: randomInt(sample(6, sampling), sample(8, sampling)) })];
    this.sources = [...articles({ rows: randomInt(sample(4, sampling), sample(6, sampling)) })];

    this.previous_question_id = previous_question_id && answers.get(previous_question_id) || undefined;
    answers.set(this.question_id, this);
  }

  get id() {
    return this.question_id;
  }

  get() {
    const now = Date.now();
    const elapsed = (now - this.timestamp) * (this._options.speedRate || 1) / 1000;
    const [answer_stage, answer, finished] = this._answer(elapsed);
    const sources = this._sources(elapsed, finished);
    const related_resources = this._relatedResources(elapsed, finished);
    const { question_id, question, datetime, previous_question_id } = this;

    return {
      affiliation: undefined,
      answer,
      answer_stage,
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

  _sources(elapsed, finished) {
    const { sources } = this;
    if (finished) {
      return sources;
    }
    const { length } = sources;
    const loaded = Math.floor(length * elapsed / ITEMS_LOADING_TIME);
    return sources.slice(0, loaded);
  }

  _relatedResources(elapsed, finished) {
    const { relatedResources } = this;
    if (finished) {
      return relatedResources;
    }
    const { length } = relatedResources;
    const loaded = Math.floor(length * elapsed / ITEMS_LOADING_TIME);
    return relatedResources.slice(0, loaded);
  }

}

function getOptions(ctx, { answerFormat, answerSampling, speedRate, ...options } = {}) {
  answerFormat = ctx.get('x-answer-format') || answerFormat;
  answerSampling = Number(ctx.get('x-answer-sampling')) || answerSampling;
  speedRate = Number(ctx.get('x-speed-rate')) || speedRate;
  return Object.freeze({ answerFormat, answerSampling, speedRate, ...options });
}

export default function(defaultOptions) {
  Object.freeze(defaultOptions);
  const router = new Router();

  router.post('/questions', (ctx) => {
    const { question, previous_answer_id } = parseBodyIfNecessary(ctx.request.body);
    const answer = new Answer(question, previous_answer_id, getOptions(ctx, defaultOptions));
    const data = {
      question_id: answer.id,
    };
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
