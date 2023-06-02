import { v4 as uuid } from 'uuid';
import { randomInt, formatDatetime, sample } from './utils.js';
import * as fields from './fields.js';
import { articles } from './articles.js';

export function answer({ question, parent_question_id, timestamp = Date.now() }, { answerFormat = 'markdown', answerSampling, answerLanguages = [] } = {}) {

  const question_id = uuid();
  const datetime = formatDatetime(timestamp);

  const sampling = answerSampling !== undefined ? Math.max(0, Math.min(1, answerSampling)) : undefined;
  const features = answerLanguages.length ? answerLanguages.map(language => `lang-${language}`) : undefined;

  const answer = fields.answer({ format: answerFormat, sampling, features });
  const related_resources = [...articles({ rows: sampleRandomInt(6, 8, sampling) })];
  const sources = [...articles({ rows: sampleRandomInt(4, 6, sampling) })];

  return {
    question,
    question_id,
    ...(parent_question_id && { parent_question_id }),
    datetime,
    answer,
    related_resources,
    sources,
  };
}

function sampleRandomInt(min, max, sampling) {
  return randomInt(sample(min, sampling), sample(max, sampling));
}
