import Dropbox from "./components/Dropbox.js";
import FileHandler from "./components/FileHandler.js";


export default class App {

  static #instance;

  static getInstance() {
    if (this.#instance === undefined) {
      this.#instance = new App();
    }
    return this.#instance;
  }

  async _listenInputEvent() {
    const file = document.getElementById("uploadInput").files[0];
    const fileHandler = new FileHandler(file);
    await fileHandler.processData();
  }

  _setUploadInput() {
    const uploadInput = document.getElementById("uploadInput");
    uploadInput.addEventListener("change", this._listenInputEvent, false);
  }

  init() {
    const dropbox = new Dropbox();
    dropbox.setDropbox();

    this._setUploadInput();
  }

}
