import { html } from './html.js';
import { javaScript } from './javascript.js';

const LANGUAGES = [
  'html',
  'javascript',
];

export class Code {

  constructor(lorem) {
    this._lorem = lorem;
  }

  any(options) {
    return this[this._lorem.utils.selectOne(LANGUAGES)](options);
  }

  html(options) {
    return html(this._lorem, options);
  }

  javaScript(options) {
    return javaScript(this._lorem, options);
  }

  // aliases
  js(...args) {
    return this.javaScript(...args);
  }

  javascript(...args) {
    return this.javaScript(...args);
  }

}
