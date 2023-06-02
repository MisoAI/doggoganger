import Ask from './ask.js';
import Search from './search.js';
import Recommendation from './recommendation.js';

export default class Api {

  constructor(options) {
    this.ask = new Ask(options);
    this.search = new Search(options);
    this.recommendation = new Recommendation(options);
  }

}
