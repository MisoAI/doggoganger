export class Questions {

  constructor(data) {
    this._fields = data._lorem.fields;
  }

  _question({} = {}) {
    return this._fields.description({ size: [4, 8], punctuation: '?' });
  }

}
