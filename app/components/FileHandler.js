import { FileValidator } from "../utils/Validators.js";
import Alert from "./Alert.js";
import Program from "../models/Program.js";
import ProgramDecoder from "../decoders/ProgramDecoder.js";
import ProgramDataExtractor from "../utils/ProgramDataExtractor.js";
import ProgramTable from "./ProgramTable.js";


export default class FileHandler {

  constructor(file) {
    this.file = file;
    this.fileName = this.file.name;
    this.fileSize = this.file.size;
    this.fileExtension = this.fileName.split(".").pop().toLowerCase();
    this.program = new Program();
  }

  _resetUploadForm() {
    document.getElementById("uploadForm").reset();
  }

  _displayData() {
    const programTable = new ProgramTable(this.program);
    programTable.deleteProgramDataPlaceholder();
    programTable.resetContainer();
    programTable.displayProgramName();
    programTable.setTables();
    programTable.toggleTables();
  }

  async _readFile() {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileData = new Uint8Array(reader.result);
          const converter = new ProgramDataExtractor(
            fileData,
            this.fileExtension
          );
          const programData = converter.run();
          const decoder = new ProgramDecoder(programData);
          this.program = await decoder.decode();
          resolve(this.program);
        } catch (error) {
          reject(error);
          const errorMessage = (
            `There was a problem reading the file: ${error.message}`
          );
          Alert.display(errorMessage, "danger");
          console.error(error);
        }
      };
      reader.onerror = () => {
        const message = "File reading failed";
        reject(new Error(message));
        Alert.display(message, "danger");
      }
      reader.readAsArrayBuffer(this.file);
    });
  }

  _validateFile() {
    const fileValidator = new FileValidator(this.fileSize, this.fileExtension);

    if (!fileValidator.validateFile()) {
      Alert.display("The file is not supported.", "danger");
      this._resetUploadForm();
      return;
    };

    return true;
  }

  async processData(file) {
    if (!this._validateFile(file)) return;
    await this._readFile(file);
    this._displayData();
  }

}
