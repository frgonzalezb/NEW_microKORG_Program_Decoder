import { ByteManipulator } from "../utils/Utilities.js";


export default class Decoder {

  constructor(dataByteArray) {
    this.dataByteArray = dataByteArray;
  }

  /**
   * Retrieves the byte at the specified index from the dataByteArray.
   *
   * @param {number} index - The position of the byte to retrieve.
   * @returns {number} The byte located at the given index.
   */
  _getByte(index) {
    return this.dataByteArray[index];
  }

  /**
   * Retrieves a slice of the dataByteArray between the start and end indices.
   *
   * @param {number} start - The starting index of the slice.
   * @param {number} end - The ending index of the slice.
   * @returns {Uint8Array} A new Uint8Array containing the bytes from the start index to, but not including, the end index.
   */
  _sliceBytes(start, end) {
    return this.dataByteArray.slice(start, end);
  }

  /**
   * Retrieves the boolean value of a parameter from a byte using a given
   * bitmask. Optionally, the logic can be inverted to return the opposite
   * boolean value.
   *
   * @param {number} byte - The byte containing the parameter value.
   * @param {number|string} bitmask - The bitmask to apply, either as a number or a string representing a common bitmask.
   * @param {boolean} [invertedLogic=false] - Whether to invert the boolean logic of the parameter value.
   * @returns {boolean} The boolean value of the parameter.
   */
  _getBooleanParamValue(byte, bitmask, invertedLogic = false) {
    let state = ByteManipulator.extractValueFromByte(byte, bitmask);
    return invertedLogic ? !state : !!state;
  }

  decode() {
    throw new Error("This method should be overridden in a subclass!");
  }

}
