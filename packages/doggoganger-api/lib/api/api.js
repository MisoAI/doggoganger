import { misoData } from '../data/index.js';
import { ApiContext } from './context.js';
import { Ask } from './ask.js';
import { Search } from './search.js';
import { Recommendation } from './recommendation.js';
import { Interactions } from './interactions.js';
import { Products } from './products.js';
import { mockJwt, decodeJwt } from '../jwt.js';

const TOKEN_LIFETIME = 60 * 60; // seconds

export function api(options) {
  return new Api(options);
}

export class Api {

  constructor(options = {}) {
    const context = this._context = new ApiContext(options);
    this.ask = new Ask(context);
    this.search = new Search(context);
    this.recommendation = new Recommendation(context);
    this.interactions = new Interactions(context);
    this.products = new Products(context);
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
        gen: this._context.generation,
      }),
    };
  }

  // Expire every token issued so far: later requests carrying one of them are
  // rejected with 401 until a token of the new generation is used. Returns the
  // new generation.
  bumpGeneration() {
    return this._context.bumpGeneration();
  }

  // Check the Authorization header value of a request, throwing a 401 error on
  // a token of a past generation. Lenient otherwise: no token means no check,
  // and a token without a generation (not issued by me(), or opaque) counts as
  // of generation 0 — accepted until the first bump.
  authorize(authorization) {
    if (!authorization) {
      return;
    }
    const token = authorization.replace(/^Bearer\s+/i, '');
    const claims = decodeJwt(token);
    const gen = claims && Number.isInteger(claims.gen) ? claims.gen : 0;
    if (gen < this._context.generation) {
      const error = new Error('Token expired');
      error.status = 401;
      throw error;
    }
  }

}
