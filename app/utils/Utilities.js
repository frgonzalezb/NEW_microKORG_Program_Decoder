class ByteManipulator {

  /**
   * Shifts the given byte by the given (positive or negative) magnitude.
   * If magnitude is positive, a left shift is performed.
   * If magnitude is negative, a right shift is performed.
   * If magnitude is zero, the byte is returned unaltered.
   * 
   * @param {number} byte The byte to shift.
   * @param {number} magnitude The number of bits to shift.
   * @returns {number} The shifted byte.
   */
  static bitshift(byte, magnitude) {
    if (magnitude === 0) return byte;
    return magnitude > 0 ? byte << magnitude : byte >> Math.abs(magnitude);
  }

  /**
   * Extracts a specific value from a byte using a given bitmask.
   * Supports common bitmasks such as most significant bit (msb) and
   * least significant bit (lsb).
   * If the provided bitmask is a string ('msb' or 'lsb'), it uses the
   * corresponding common bitmask.
   * Otherwise, it uses the provided numeric bitmask.
   *
   * @param {number} byte - The byte from which the value will be extracted.
   * @param {number|string} bitmask - The bitmask to apply, either as a number or a string representing a common bitmask.
   * @returns {number} The extracted value from the byte.
   */
  static extractValueFromByte(byte, bitmask) {
    const commonBitmasks = { msb: 0x80, lsb: 0x01 };
    if (bitmask in commonBitmasks) return byte & commonBitmasks[bitmask];
    return byte & bitmask;
  }

  /**
   * Scales the least significant byte (LSB) contribution by a factor of 128.
   * This scaling is used for MIDI data where the LSB contributes to the total
   * value with a 2^7 multiplier.
   *
   * @param {number} lsb - The least significant byte to be scaled.
   * @returns {number} The scaled LSB contribution.
   */
  static scaleLsbContribution(lsb) {
    const midiLsbScale = 128;
    return lsb * midiLsbScale;
  }

  /**
   * Combines the contribution of the shifted value, the least significant byte
   * (LSB) and the current MIDI byte into a single value. The shifted value is
   * multiplied by a factor of 256 (2^8) to shift it by one byte, then added to
   * the LSB contribution, and then the current MIDI byte is added.
   * @param {number} shiftedValue - The value after shifting the previous bytes.
   * @param {number} lsbContribution - The contribution of the least significant byte.
   * @param {number} midiByte - The current MIDI byte.
   * @returns {number} The combined value.
   */
  static combineVlqBytes(shiftedValue, lsbContribution, midiByte) {
    const midiByteShift = 256; // 2^8 shifts by one byte
    return midiByteShift * shiftedValue + lsbContribution + midiByte;
  }

  /**
   * Processes the next Variable Length Quantity (VLQ) byte for MIDI data.
   * It takes the current byte, the bytes to read, and the 7-bit mask for the
   * current byte, and returns the combined value.
   *
   * @param {number} currentByte - The current byte to process.
   * @param {number} bytesToRead - The bytes to read for the VLQ.
   * @param {number} sevenBitMask - The 7-bit mask for the current byte.
   * @returns {number} The combined value of the processed byte.
   */
  static processNextVlqByte(currentByte, bytesToRead, sevenBitMask) {
    const shiftedValue = this.bitshift(bytesToRead, -1);
    const lsb = this.extractValueFromByte(bytesToRead, "lsb");
    const lsbContribution = this.scaleLsbContribution(lsb);
    const midiByte = this.extractValueFromByte(
      currentByte,
      sevenBitMask
    );
    return this.combineVlqBytes(shiftedValue, lsbContribution, midiByte);
  }

  /**
   * Selects an option from a list based on a processed byte value. Optionally,
   * the byte can be bit-shifted before extracting the index using a bitmask.
   *
   * @param {number} byte - The byte from which the index will be extracted.
   * @param {Array} options - The list of options to select from.
   * @param {number|string} bitmask - The bitmask to apply for index extraction.
   * @param {number} [shift=0] - The number of bits to shift the byte (default is 0).
   * @returns {*} The selected option from the options array.
   */
  static selectOptionFromByte(byte, options, bitmask, shift = 0) {
    if (shift !== 0) {
        byte = this.bitshift(byte, shift);
    }
    const index = this.extractValueFromByte(byte, bitmask);
    return options[index];
  }

  /**
   * Returns a new Uint8Array which is a slice of the given array.
   * The returned array will have elements from the start index up to, but not including, the end index.
   *
   * @param {Uint8Array} byteArray - The array to slice.
   * @param {number} start - The index at which to start the slice.
   * @param {number} end - The index at which to end the slice.
   * @return {Uint8Array} The sliced array.
   */
  static sliceBytes(start, end) {
    return this.byteArray.slice(start, end);
  }

}


class Formatter {

  /**
   * Converts a byte value to its ASCII character representation.
   *
   * @param {number} byte - The byte to convert.
   * @return {string} The ASCII character corresponding to the byte.
   */
  static getAsciiRepresentation(byte) {
    return String.fromCharCode(byte);
  }

  /**
   * Converts a Uint8Array of bytes into an ASCII string.
   * Each byte is converted to its ASCII character representation,
   * and the characters are concatenated to form the final string.
   *
   * @param {Uint8Array} byteArray - The array of bytes to convert.
   * @returns {string} The resulting ASCII string.
   */
  static convertBytesToAsciiString(byteArray) {
    return byteArray.reduce(
      (name, byte) => name + this.getAsciiRepresentation(byte),
      ""
    );
  }

  /**
   * Converts a value to its percentage representation by appending
   * the "%" string to the end of the value. The value is expected to be
   * a number between 0 and 100.
   *
   * @param {number} value - The value to convert.
   * @returns {string} The value formatted as a percentage string.
   */
  static formatValueAsPercent(value) {
    return value + "%";
  }

}


class ValueNormalizer {

  /**
   * Offsets the given value by a specified amount.
   *
   * @param {number} value - The value to be offset.
   * @param {number} [offset=64] - The amount by which to offset the value. Defaults to 64.
   * @returns {number} The resulting value after applying the offset.
   */

  static offsetValue(value, offset = 64) {
    return value - offset;
  }

  /**
   * Normalizes the given value to fit within the given range, optionally
   * capping it at the given absolute range limit.
   * If the given value is 0, it is returned as is.
   * If the given value is positive, it is capped at the given absolute
   * range limit.
   * If the given value is negative, it is floored at the negative of
   * the given absolute range limit.
   *
   * @param {number} rawValue - The value to normalize.
   * @param {number} [absoluteLimit=63] - The absolute range limit to which the value should be normalized.
   * @returns {number} The normalized value.
   */
  static getNormalizedValue(rawValue, absoluteLimit = 63) {
    const zeroPointIndex = 64;
    const offsetValue = this.offsetValue(rawValue, zeroPointIndex);
    
    if (offsetValue === 0) return offsetValue;
    
    const positiveValue = Math.min(offsetValue, absoluteLimit);
    const negativeValue = Math.max(offsetValue, -absoluteLimit);
    
    return (offsetValue > 0) ? positiveValue : negativeValue;
  }

}


class JsonHelper {

  /**
   * Retrieves data from a JSON file located at the specified path.
   * Fetches the JSON data asynchronously and returns it as a JavaScript object.
   * If an error occurs during the fetch or JSON parsing, it logs the error to the console.
   *
   * @param {string} jsonPath - The path to the JSON file.
   * @returns {Promise<Object>} A promise that resolves to the parsed JSON object.
   */
  static async retrieveDataFromJson(jsonPath) {
    try {
      const response = await fetch(jsonPath);
      const json = await response.json();
      return json;
    } catch (error) {
      return console.error(error);
    }
  }

}

export {
  ByteManipulator,
  Formatter,
  JsonHelper,
  ValueNormalizer
};
