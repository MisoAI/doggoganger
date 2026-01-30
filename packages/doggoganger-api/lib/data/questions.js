export class Questions {

  constructor(data) {
    this._lorem = data._lorem;
  }

  _question({} = {}) {
    return this._lorem.fields.description({ size: [4, 8], punctuation: '?' });
  }

}
