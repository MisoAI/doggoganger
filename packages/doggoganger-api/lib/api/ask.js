import { misoData } from '../data/index.js';
import { BASE_TIMESTAMP, trimObj } from '../utils.js';
import { MODE_QUESTION, MODE_SEARCH } from './constants.js';
import { UserHistory } from './history.js';
import { UserHistoryV0 } from './history-v0.js';

const CPS = 100;
const ITEMS_LOADING_TIME = 3; // seconds
const QUESTION_REVISED_TIME = 3; // seconds
const MOCK_POLLING_INTERVAL = 1; // seconds
// A starting poll index far beyond any answer's completion, so an Answer
// created with { finished: true } reports as finished on its very first poll.
const FINISHED_INDEX = 1e6;
// Each answer is dated a minute after the previous one, so questions asked in
// the same session are ordered rather than sharing a single timestamp.
const DATETIME_INCREMENT = 60 * 1000; // milliseconds

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

export class Ask {

  constructor(options = {}) {
    this._options = options;
    this._answers = new Map();
    this._answerCount = 0;
    this.userHistory = new UserHistory(this);
    this.userHistoryV0 = new UserHistoryV0(this);
  }

  questions(payload, { seed, ...options } = {}) {
    const data = misoData({ seed });
    const { question_id } = this._createAnswer(data, MODE_QUESTION, payload, options);
    return { question_id };
  }

  // Entries match the input order; unknown question ids yield null
  answers({ question_ids }) {
    return question_ids.map(question_id => this._answers.has(question_id) ? this.answer(question_id) : null);
  }

  search(payload, { seed, ...options } = {}) {
    const data = misoData({ seed });
    const miso_id = data._lorem.prng.uuid();
    const result = { miso_id, ...data.searchResults(payload) };
    if (payload.answer === undefined || payload.answer) {
      result.question_id = this._createAnswer(data, MODE_SEARCH, payload, options).question_id;
    }
    return result;
  }

  query_suggestion({ q, rows = 5, ...rest }, { seed } = {}) {
    const data = misoData({ seed });
    return {
      completions: data.simpleCompletions({ q, rows, ...rest }),
    };
  }

  autocomplete({ q, rows = 5, ...rest }, { seed } = {}) {
    const data = misoData({ seed });
    return {
      completions: data.simpleCompletions({ q, rows, ...rest }),
    };
  }

  search_autocomplete({ q, completion_fields = ['title'], rows = 5, ...rest }, { seed } = {}) {
    const data = misoData({ seed });
    return {
      completions: data.completions({ q, completion_fields, rows, ...rest }),
    };
  }

  _createAnswer(data, mode, payload, options = {}) {
    // An explicit timestamp in the payload still wins over the running clock
    const answer = new Answer(data, mode, { timestamp: this._nextTimestamp(), ...payload }, { ...this._options, ...options });
    this._answers.set(answer.question_id, answer);
    // An explicit log_user_history = false opts the question out of user history
    if (payload.log_user_history !== false) {
      this.userHistory._track(answer._data);
    }
    return answer;
  }

  _nextTimestamp() {
    return BASE_TIMESTAMP + this._answerCount++ * DATETIME_INCREMENT;
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

  related_questions(payload, { seed } = {}) {
    const data = misoData({ seed });
    const miso_id = data._lorem.prng.uuid();
    return {
      related_questions: data.questions(payload),
      miso_id,
    };
  }

  trending_questions(payload, options) {
    return this.related_questions(payload, options);
  }

}

class Answer {

  constructor(data, mode, payload, { answerFormat, answerSampling, answerLanguages, finished = false, ...options } = {}) {
    this._mode = mode;
    this._options = Object.freeze(options);
    this._data = data.answer(payload, { answerFormat, answerSampling, answerLanguages });

    // A finished answer starts far past completion in both timing modes: the
    // detemporized poll index and the wall-clock timestamp are pushed ahead.
    this._timestamp = Date.now() - (finished ? FINISHED_INDEX * 1000 : 0);
    this._index = finished ? FINISHED_INDEX : 1;
  }

  get question_id() {
    return this._data.question_id;
  }

  get searchResults() {
    const { products, total, facet_counts } = this._data;
    return trimObj({ products, total, facet_counts });
  }

  get() {
    const elapsed = this._elapsed();
    const question = this._question(elapsed);
    const [answer_stage, answer, finished, revision] = this._answer(elapsed);
    const sources = this._sources(elapsed, finished);
    const related_resources = this._related_resources(elapsed, finished);
    const followup_questions = this._followup_questions(elapsed, finished);
    const { question_id, datetime, parent_question_id, metadata, images } = this._data;

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
          metadata,
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

  _elapsed() {
    return this._options.detemporize ?
      this._index++ * MOCK_POLLING_INTERVAL :
      (Date.now() - this._timestamp) * (this._options.speedRate || 1) / 1000;
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
