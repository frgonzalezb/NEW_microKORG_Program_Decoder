import Alert from "../components/Alert.js";


export class FileValidator {

  _validExtensions = ["prg", "syx"];
  _validFileSizes = { mk1: 326, mks: 328, syx: 297 };

  constructor(fileSize, fileExtension) {
    this.fileSize = fileSize;
    this.fileExtension = fileExtension;
  }

  /**
   * Validates if the file extension is PRG or SYX.
   * 
   * @return {boolean} True if the file extension is PRG or SYX, false otherwise.
   */
  _validateFileExtension() {
    return this._validExtensions.includes(this.fileExtension);
  }
  
  /**
   * Validates if the file size is valid. Currently supported file sizes are
   * 326 bytes for the original microKORG and 328 bytes for the microKORG S.
   * Individual-program SYX files have a size of 297 bytes.
   * 
   * @return {boolean} True if the file size is valid, false otherwise.
   */
  _validateFileSize() {
    return Object.values(this._validFileSizes).includes(this.fileSize);
  }

  validateFile() {
    const IsMultiProgramSyx = this.fileSize > this._validFileSizes.syx;
    if (this.fileExtension === "syx" && IsMultiProgramSyx) {
      Alert.display(
        "Multiple-program SYX files are not supported.",
        "danger"
      );
      return false;
    };
    return this._validateFileExtension() && this._validateFileSize();
  }

}
