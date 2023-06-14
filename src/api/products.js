export default class Products {

  constructor(options) {
    this._options = options;
  }

  upload(records) {
    return [];
  }

  ids() {
    const ids = [];
    for (let i = 0; i < 5000; i++) {
      ids.push(mockProductId(i));
    }
    return {
      ids,
    };
  }

  // TODO: delete (batch)

}

function mockProductId(i) {
  const prefix = i < 10 ? 'p_000' : i < 100 ? 'p_00' : i < 1000 ? 'p_0' : 'p_';
  return `${prefix}${i}`;
}
