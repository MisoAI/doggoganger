import Ask from './ask.js';
import Search from './search.js';
import Recommendation from './recommendation.js';
import Interactions from './interactions.js';
import Products from './products.js';

export default class Api {

  constructor(options) {
    this.ask = new Ask(options);
    this.search = new Search(options);
    this.recommendation = new Recommendation(options);
    this.interactions = new Interactions(options);
    this.products = new Products(options);
  }

}
