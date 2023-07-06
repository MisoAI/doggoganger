import { answer } from '../data/index.js';

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

export default class Ask {

  constructor(options = {}) {
    this._options = options;
    this._answers = new Map();
  }

  questions(payload, options = {}) {
    return new Answer(payload, { ...this._options, ...options });
  }

}

class Answer {

  constructor({ question, parent_question_id }, { answerFormat, answerSampling, answerLanguages, ...options } = {}) {
    this._options = Object.freeze(options);
    const timestamp = this.timestamp = Date.now();
    this._data = answer({ question, parent_question_id, timestamp }, { answerFormat, answerSampling, answerLanguages });
  }

  get question_id() {
    return this._data.question_id;
  }

  get() {
    const now = Date.now();
    const elapsed = (now - this.timestamp) * (this._options.speedRate || 1) / 1000;
    const [answer_stage, answer, finished] = this._answer(elapsed);
    const sources = this._sources(elapsed, finished);
    const related_resources = this._related_resources(elapsed, finished);
    const followup_questions = this._followup_questions(elapsed, finished);
    const { question_id, question, datetime, parent_question_id } = this._data;

    return {
      answer,
      answer_stage,
      datetime,
      finished,
      parent_question_id,
      question,
      question_id,
      sources,
      related_resources,
      followup_questions,
    };
  }

  _answer(elapsed) {
    for (const stage of STAGES) {
      elapsed -= stage.duration;
      if (elapsed < 0) {
        return [stage.name, stage.text, false];
      }
    }
    const { answer } = this._data;
    const length = Math.floor(elapsed * CPS);
    const finished = length >= answer.length;
    const text = finished ? answer : answer.slice(0, length);
    return ['result', text, finished];
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
