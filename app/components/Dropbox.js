import FileHandler from "./FileHandler.js";


export default class Dropbox {

  constructor() {}

  #dragenter(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  #dragover(e) {
    e.stopPropagation();
    e.preventDefault();
    filedrag.className = "hover";
  }

  async #drop(e) {
    e.stopPropagation();
    e.preventDefault();

    filedrag.className = "";

    const dt = e.dataTransfer;
    const file = dt.files[0];

    const fileHandler = new FileHandler(file);
    await fileHandler.processData();
  }

  setDropbox() {
    const dropbox = document.getElementById("filedrag");
    dropbox.innerHTML = "Drop your PRG or SYX file here!";
    dropbox.addEventListener("dragenter", this.#dragenter, false);
    dropbox.addEventListener("dragover", this.#dragover, false);
    dropbox.addEventListener("drop", this.#drop, false);
  }

}