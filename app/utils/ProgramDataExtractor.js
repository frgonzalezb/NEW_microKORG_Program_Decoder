import { ByteManipulator } from "./Utilities.js";
import Alert from "../components/Alert.js";
import AudioPilz from "./AudioPilz.js";


export default class ProgramDataExtractor {

  bytesToRead = 0;
  chunksToRead = 36;
  device = "";
  pointer = 0;

  /**
   * Creates a new ProgramDataExtractor instance.
   *
   * @param {Uint8Array} fileData - The PRG file data to read from.
   * @param {string} fileExtension - The file extension (PRG or SYX).
   */
  constructor(fileData, fileExtension) {
    this.fileData = fileData;
    this.fileExtension = fileExtension;
  }

  /**
   * Increments the file pointer by a specified number of steps.
   *
   * @param {number} steps - The number of steps to increment the pointer by. Defaults to 1.
   */
  incrementPointer(steps = 1) {
    this.pointer += steps;
  }

  /**
   * Reads a single byte from the file data at the current file pointer
   * position and returns it.
   *
   * @return {number} The byte at the current file pointer position.
   */
  readByte() {
    return this.fileData[this.pointer];
  }

  /**
   * Returns a new Uint8Array which is a slice of the file data. The returned
   * array will have elements from the start index up to, but not including, the
   * end index.
   *
   * @param {number} start - The index at which to start the slice.
   * @param {number} end - The index at which to end the slice.
   * @return {Uint8Array} The sliced array.
   */
  sliceBytes(start, end) {
    return this.fileData.slice(start, end);
  }

  /**
   * Reads a specified number of bytes from the file data at the current file
   * pointer position and returns them as a new Uint8Array. After the read
   * operation the file pointer is incremented by the number of bytes read.
   *
   * @param {number} length - The number of bytes to read.
   * @return {Uint8Array} A new Uint8Array containing the read bytes.
   */
  readBytes(length) {
    const chunk = this.sliceBytes(this.pointer, this.pointer + length);
    this.incrementPointer(length);
    return chunk;
  }

  /**
   * Resets all properties of this ProgramDataExtractor to their default state.
   * This is useful when reusing an existing ProgramDataExtractor instance to
   * process a new file.
   */
  resetAllProperties() {
    this.fileData = null;
    this.fileExtension = null;
    this.pointer = 0;
    this.bytesToRead = 0;
    this.chunksToRead = 0;
    this.device = "";
  }

  /**
   * Determines if the file pointer has reached the end of the file data.
   *
   * @return {boolean} True if the file pointer is at the end of the file data, false otherwise.
   */
  isAtEnd() {
    return this.pointer === this.fileData.length;
  }

  findByteIndex(targetByte) {
    const data = this.fileData;
    for (let i = 0; i < data.length; i++) {
      if (data[i] === targetByte) return i;
    }
    return -1;
  }

  findSysexStart() {
    const sysexStartByte = 0xF0;
    const sysexStartIndexesByFileExtension = {
      prg: 23,
      syx: 0
    };
    const targetIndex = sysexStartIndexesByFileExtension[this.fileExtension];
    const sysexStartIndex = this.findByteIndex(sysexStartByte);

    if (sysexStartIndex !== targetIndex) {
      const message = (
        `Failed to find start of SysEx (0xF0) at index ${targetIndex}. ` +
        `Not a valid PRG or SYX file.`
      );
      Alert.display(message, "danger");
      throw new Error(message);
    }

    this.incrementPointer(sysexStartIndex + 1);
  }

  defineBytesToRead() {
    const bytesToReadReference = {
      mk1: 296,
      mks: 298
    };

    this.bytesToRead = bytesToReadReference[this.device];
  }

  findKorgFlag() {
    const korgFlag = 0x42;
    const isFlagFound = (this.readByte() === korgFlag);
    if (!isFlagFound) return false;
    this.incrementPointer(2);
    return true;
  }

  findMk1Flag() {
    const mk1Flag = 0x58;
    const isFlagFound = this.readByte() === mk1Flag;
    if (!isFlagFound) return false;
    this.device = "mk1";
    AudioPilz.printBoxesGag("I come from a classic microKORG");
    this.incrementPointer();
    return true;
  }

  findMksFlags(fileData, pointer) {
    const mksFlags = [0x00, 0x01, 0x40];
    const areFlagsFound = mksFlags.every((flag, index) =>
      fileData[pointer + index] === flag
    );
    if (!areFlagsFound) return false;
    this.device = "mks";
    AudioPilz.printBoxesGag("I come from a modern microKORG S");
    this.incrementPointer(2);
    return true;
  }

  findDevice() {
    if (this.fileExtension === "prg") {
      this.incrementPointer(2); // advance to 26
    }
    const isKorg = this.findKorgFlag();
    const isMk1 = this.findMk1Flag();
    const isMks = this.findMksFlags(this.fileData, this.pointer);
    if (!isKorg && !isMk1 && !isMks) {
      const message = "This PRG file is not from a supported device!";
      Alert.display(message, "danger");
      throw new Error(message);
    }
  }

  findCurrentProgramDataDump() {
    const targetFlag = 0x40;
    const isCurrentProgramDataDump = (this.readByte() === targetFlag);

    if (!isCurrentProgramDataDump) {
      const message = (
        "The file appears not to be a one program only " +
        "(a byte 0x40 was expected to signal " +
        `"current program data dump").`
      );
      Alert.display(message, "danger");
      throw new Error(message);
    }
    this.incrementPointer();
  }

  getCurrentDataPoint(index) {
    const offset = 1;
    return index + offset + this.pointer;
  }

  appendValueToMidiChunk(currentFileByte, currentDataPoint) {
    const msbFlag = 0x80;   // MSB flag for 7-bit MIDI format
    const noMsbFlag = 0x00; // No MSB flag for 7-bit MIDI format

    const currentValue = ByteManipulator.extractValueFromByte(
      currentFileByte,
      "lsb"
    );
    const msb = currentValue ? msbFlag : noMsbFlag;

    return msb | this.fileData[currentDataPoint];
  }

  /**
   * Reads a 7-byte (8-bit) chunk from the PRG file data and converts it
   * to an 8-byte (7-bit) chunk of SysEx message data (a.k.a. MIDI data).
   * Actually, the 7-bit format is 8-bit, but the MSB of each byte
   * is set to 0. The first byte in the 8-byte chunk will contain the
   * actual MSBs for the next 7 bytes.
   * 
   * Please see Note 5 (data dump conversion) in the microKORG MIDI
   * Implementation Guide for in-depth details.
   */
  convertPrgFileBytesToMidiBytes() {
    const midiDataByteSize = 7;
    const nextMidiChunkDistance = 8;

    let midiChunk = new Uint8Array(midiDataByteSize);
    let currentFileByte = this.readByte();

    for (let i = 0; i < midiDataByteSize; i++) {
      const currentDataPoint = this.getCurrentDataPoint(i);
      midiChunk[i] = this.appendValueToMidiChunk(
        currentFileByte,
        currentDataPoint
      )
      currentFileByte = ByteManipulator.bitshift(currentFileByte, -1);
    }

    this.incrementPointer(nextMidiChunkDistance); // 1 MSB byte + 7 data bytes

    return midiChunk;
  }

  getProgramData() {
    if (this.device === "mks") this.incrementPointer();

    const fileDataChunkSize = 7;
    let programData = new Uint8Array(this.chunksToRead * fileDataChunkSize);

    for (let i = 0; i < this.chunksToRead; i++) {
      const midiChunk = this.convertPrgFileBytesToMidiBytes();
      const startIndex = i * fileDataChunkSize;

      programData.set(midiChunk, startIndex);
    }

    return programData;
  }

  setPointerToMidiSysexEnd() {
    const lastProgramDataIndex = { mk1: 318, mks: 320, syx: 293 };
    if (!this.pointer === lastProgramDataIndex[this.device]) {
      const message = (
        "Program data extraction failed.\n"
        `Expected pointer to be at index ${lastProgramDataIndex[this.device]}\n`
        `Actual pointer value is ${this.pointer}`
      );
      Alert.display(message, "danger");
      throw new Error(message);
    }
    this.incrementPointer(3); // SysEx end byte is just 3 bytes above
  }

  findSysexEnd() {
    this.setPointerToMidiSysexEnd();
    const midiSysexEnd = 0xF7;
    const isSysexEndValid = (this.readByte() === midiSysexEnd);

    if (!isSysexEndValid) {
      const message = (
        "Failed to detect correct ending byte (0xF7). " +
        "The process will continue, but assume errors in the data."
      );
      Alert.display(message, "warning");
      console.warn(message);
    }
  }

  run() {
    this.findSysexStart(23);
    this.findDevice();
    this.findCurrentProgramDataDump();
    this.defineBytesToRead();
    
    const programData = this.getProgramData();

    this.findSysexEnd();

    // Once you're done, clean up your mess!
    this.resetAllProperties();

    return programData;
  }

}
