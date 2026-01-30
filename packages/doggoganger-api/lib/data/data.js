import { lorem } from '@miso.ai/lorem';
import { Products } from './products.js';
import { Articles } from './articles.js';
import { Questions } from './questions.js';
import { Images } from './images.js';
import { Completions } from './completions.js';
import { Facets } from './facets.js';
import { Search } from './search.js';
import { Answers } from './answers.js';

export function misoData(options) {
  return new MisoData(options);
}

class MisoData {

  constructor(options) {
    this._lorem = lorem(options);

    // Initialize in dependency order
    this._articles = new Articles(this);
    this._products = new Products(this);
    this._questions = new Questions(this);
    this._images = new Images(this);
    this._completions = new Completions(this);
    this._facets = new Facets(this);

    // These depend on the above
    this._search = new Search(this);
    this._answers = new Answers(this);
  }

  // Articles
  articles({ rows, ...options } = {}) {
    const results = [];
    for (let i = 0; i < rows; i++) {
      results.push(this._articles._article({ ...options, index: i }));
    }
    return results;
  }

  // Products
  products({ rows, ...options } = {}) {
    const results = [];
    for (let i = 0; i < rows; i++) {
      results.push(this._products._product({ ...options, index: i }));
    }
    return results;
  }

  // Questions
  questions({ rows = 5, ...options } = {}) {
    const results = [];
    for (let i = 0; i < rows; i++) {
      results.push(this._questions._question({ ...options, index: i }));
    }
    return results;
  }

  // Images
  images({ rows, ...options } = {}) {
    const results = [];
    for (let i = 0; i < rows; i++) {
      results.push(this._images._image({ ...options, index: i }));
    }
    return results;
  }

  // Completions
  completions(options) {
    return this._completions._completions(options);
  }

  // Facets
  facets(options) {
    return this._facets._facets(options);
  }

  // Search
  searchResults(options) {
    return this._search._searchResults(options);
  }

  // Answers
  answer(payload, options) {
    return this._answers._answer(payload, options);
  }

}
