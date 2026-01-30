import { formatDatetime, sample, excludeHtml } from '../utils.js';

export class Answers {

  constructor(data) {
    this._data = data;
  }

  _answer({
    _ctrl = {},
    question,
    parent_question_id,
    fl = ['cover_image', 'url'],
    source_fl = ['cover_image', 'url'],
    related_resource_fl = ['cover_image', 'url'],
    cite_link = false,
    cite_start = '[',
    cite_end = ']',
    rows = 10,
    facets,
    timestamp = Date.now(),
    _meta: {
      page = 0,
    } = {},
  }, { answerFormat = 'markdown', answerSampling, answerLanguages = [] } = {}) {

    const data = this._data;
    const { fields, prng, utils } = data._lorem;

    const question_id = prng.uuid();
    const datetime = formatDatetime(timestamp);

    const sampling = answerSampling !== undefined ? Math.max(0, Math.min(1, answerSampling)) : undefined;
    const features = answerLanguages.length ? answerLanguages.map(language => `lang-${language}`) : undefined;

    const related_resources = data.articles({ rows: this._sampleRandomInt(6, 8, sampling), fl: related_resource_fl }).map(excludeHtml);
    const images = data.images({ rows: this._sampleRandomInt(2, 12, sampling) });
    const sources = data.articles({ rows: this._sampleRandomInt(4, 6, sampling), fl: source_fl }).map(excludeHtml);

    const total = _ctrl.total !== undefined ? _ctrl.total : prng.randomInt(1000, 10000);
    const products = data.articles({ rows: Math.min(total - page * rows, rows), fl }).map(excludeHtml);

    const facet_counts = facets ? { facet_fields: data.facets({ facets, _ctrl }) } : undefined;

    const citation = {
      link: cite_link !== '0' && !!cite_link,
      start: cite_start,
      end: cite_end,
      unused: utils.shuffle([...Array(sources.length).keys()]),
    };
    const answer = fields.answer({ sources, citation, format: answerFormat, sampling, features });
    const followup_questions = data.questions({ rows: this._sampleRandomInt(3, 6) });

    return {
      question,
      question_id,
      ...(parent_question_id && { parent_question_id }),
      datetime,
      answer,
      images,
      sources,
      products,
      total,
      facet_counts,
      related_resources,
      followup_questions,
    };
  }

  _sampleRandomInt(min, max, sampling) {
    return this._data._lorem.prng.randomInt(sample(min, sampling), sample(max, sampling));
  }

}
