export default class Section {

  constructor(name) {
    this.name = name;
    this.params = {};
  }

  setParams(params) {
    this.params = params;
  }

  pushParam(id, param) {
    this.params[id] = param;
  }

}
