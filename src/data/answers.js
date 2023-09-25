import { randomInt, formatDatetime, sample, uuid, shuffle } from './utils.js';
import * as fields from './fields.js';
import { articles } from './articles.js';
import { questions } from './questions.js';

export function answer({
  question,
  parent_question_id,
  source_fl = ['cover_image', 'url'],
  related_resource_fl = ['cover_image', 'url'],
  cite_link = false,
  cite_start = '[',
  cite_end = ']',
  timestamp = Date.now(),
}, { answerFormat = 'markdown', answerSampling, answerLanguages = [] } = {}) {

  const question_id = uuid();
  const datetime = formatDatetime(timestamp);

  const sampling = answerSampling !== undefined ? Math.max(0, Math.min(1, answerSampling)) : undefined;
  const features = answerLanguages.length ? answerLanguages.map(language => `lang-${language}`) : undefined;

  const related_resources = [...articles({ rows: sampleRandomInt(6, 8, sampling), fl: related_resource_fl })].map(excludeHtml);
  const sources = [...articles({ rows: sampleRandomInt(4, 6, sampling), fl: source_fl })].map(excludeHtml);

  const citation = {
    link: cite_link !== '0' && !!cite_link,
    start: cite_start,
    end: cite_end,
    unused: shuffle([...Array(sources.length).keys()]),
  };
  const answer = fields.answer({ sources, citation, format: answerFormat, sampling, features });
  const followup_questions = [...questions({ rows: sampleRandomInt(3, 6) })];

  return {
    question,
    question_id,
    ...(parent_question_id && { parent_question_id }),
    datetime,
    answer,
    sources,
    related_resources,
    followup_questions,
  };
}

function sampleRandomInt(min, max, sampling) {
  return randomInt(sample(min, sampling), sample(max, sampling));
}

function excludeHtml({ html, ...rest }) {
  return rest;
}
