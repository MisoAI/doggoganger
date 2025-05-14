import { trimObj } from '../utils.js';
import { answer, questions, completions, utils } from '../data/index.js';

const CPS = 100;
const ITEMS_LOADING_TIME = 3;
const QUESTION_REVISED_TIME = 3;
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

const MODE_QUESTION = 0;
const MODE_SEARCH = 1;

export default class Ask {

  constructor(options = {}) {
    this._options = options;
    this._answers = new Map();
  }

  questions(payload, options = {}) {
    const answer = this._createAnswer(MODE_QUESTION, payload, options);
    const { question_id } = answer;
    return { question_id };
  }

  search(payload, options = {}) {
    const miso_id = utils.uuid();
    let question_id = payload._meta && payload._meta.question_id;
    const includeAnswer = payload.answer === undefined || payload.answer;
    const answer = question_id && this._answers.get(question_id) || this._createAnswer(MODE_SEARCH, payload, options);
    question_id = question_id || answer.question_id;

    // TODO: search results should not be bound to question_id
    const result = { miso_id, ...answer.searchResults };
    if (includeAnswer) {
      result.question_id = question_id;
    }
    return result;
  }

  autocomplete({ q, completion_fields = ['title'], rows = 5 }) {
    return {
      completions: completions({ q, completion_fields, rows }),
    };
  }

  search_autocomplete(args) {
    return this.autocomplete(args);
  }

  _createAnswer(mode, payload, options = {}) {
    const answer = new Answer(mode, payload, { ...this._options, ...options });
    this._answers.set(answer.question_id, answer);
    return answer;
  }

  answer(questionId) {
    const answer = this._answers.get(questionId);
    if (!answer) {
      const error = new Error(`Question not found: ${questionId}`);
      error.status = 404;
      throw error;
    }
    return answer.get();
  }

  related_questions(payload) {
    const miso_id = utils.uuid();
    return {
      related_questions: [...questions(payload)],
      miso_id,
    };
  }

  trending_questions(payload) {
    return this.related_questions(payload);
  }

}

class Answer {

  constructor(mode, payload, { answerFormat, answerSampling, answerLanguages, ...options } = {}) {
    this._mode = mode;
    this._options = Object.freeze(options);
    const timestamp = this.timestamp = Date.now();
    this._data = answer({ ...payload, timestamp }, { answerFormat, answerSampling, answerLanguages });
  }

  get question_id() {
    return this._data.question_id;
  }

  get searchResults() {
    const { products, total, facet_counts } = this._data;
    return trimObj({ products, total, facet_counts });
  }

  get() {
    const now = Date.now();
    const elapsed = (now - this.timestamp) * (this._options.speedRate || 1) / 1000;
    const question = this._question(elapsed);
    const [answer_stage, answer, finished, revision] = this._answer(elapsed);
    const sources = this._sources(elapsed, finished);
    const related_resources = this._related_resources(elapsed, finished);
    const followup_questions = this._followup_questions(elapsed, finished);
    const { question_id, datetime, parent_question_id, images } = this._data;

    switch (this._mode) {
      case MODE_QUESTION:
        return {
          answer,
          answer_stage,
          datetime,
          finished,
          revision,
          parent_question_id,
          question,
          question_id,
          images,
          sources,
          related_resources,
          followup_questions,
        };
      case MODE_SEARCH:
        return {
          answer,
          answer_stage,
          datetime,
          finished,
          revision,
          question_id,
          images,
          sources,
        };
      default:
        throw new Error(`Unknown mode: ${this._mode}`);
    }
  }

  _question(elapsed) {
    const { question } = this._data;
    return elapsed > QUESTION_REVISED_TIME ? `${question} [revised]` : question;
  }

  _answer(elapsed) {
    let elapsedInStage = elapsed;
    for (const stage of STAGES) {
      elapsedInStage -= stage.duration;
      if (elapsedInStage < 0) {
        return [stage.name, stage.text, false, elapsed];
      }
    }
    const { answer } = this._data;
    const length = Math.floor(elapsedInStage * CPS);
    const finished = length >= answer.length;
    const text = finished ? answer : answer.slice(0, length);
    return ['result', text, finished, elapsed];
  }

  _sources(elapsed, finished) {
    const { sources } = this._data;
    if (finished) {
      return sources;
    }
    const { length } = sources;
    const loaded = Math.floor(length * elapsed / ITEMS_LOADING_TIME);
    return sources.slice(0, loaded);
  }

  _related_resources(elapsed, finished) {
    const { related_resources } = this._data;
    if (finished) {
      return related_resources;
    }
    const { length } = related_resources;
    const loaded = Math.floor(length * elapsed / ITEMS_LOADING_TIME);
    return related_resources.slice(0, loaded);
  }

  _followup_questions(elapsed, finished) {
    const { followup_questions } = this._data;
    if (finished || !followup_questions) {
      return followup_questions;
    }
    const { length } = followup_questions;
    const loaded = Math.floor(length * elapsed / ITEMS_LOADING_TIME);
    return followup_questions.slice(0, loaded);
  }

}
