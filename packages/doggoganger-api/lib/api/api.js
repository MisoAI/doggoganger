import { misoData } from '../data/index.js';
import { Ask } from './ask.js';
import { Search } from './search.js';
import { Recommendation } from './recommendation.js';
import { Interactions } from './interactions.js';
import { Products } from './products.js';
import { mockJwt } from '../jwt.js';

const TOKEN_LIFETIME = 60 * 60; // seconds

export function api(options) {
  return new Api(options);
}

export class Api {

  constructor(options = {}) {
    this.ask = new Ask(options);
    this.search = new Search(options);
    this.recommendation = new Recommendation(options);
    this.interactions = new Interactions(options);
    this.products = new Products(options);
  }

  // The signed-in user, as a mocked JWT the client can decode for its claims.
  // `timestamp` (milliseconds) pins the issue time; it defaults to now so the
  // token reads as freshly issued and unexpired.
  me({ seed, timestamp = Date.now() } = {}) {
    const { fields, prng } = misoData({ seed })._lorem;
    const name = fields.authors({ size: 1 })[0];
    const iat = Math.floor(timestamp / 1000);
    return {
      jwt: mockJwt({
        iss: 'doggoganger',
        sub: prng.uuid(),
        name,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        iat,
        exp: iat + TOKEN_LIFETIME,
      }),
    };
  }

}
