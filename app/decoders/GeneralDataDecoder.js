/**
 * NOTE: The complete reference for all this can be found in the
 * microKORG MIDI Implementation Guide, specifically in the
 * TABLE 1 : PROGRAM PARAMETER( 1 PROGRAM, CURRENT PROGRAM )
 */

import { ByteManipulator, Formatter, ValueNormalizer } from "../utils/Utilities.js";
import Decoder from "./Decoder.js";
import Section from "../models/Section.js";
import Param from "../models/Param.js";


export default class GeneralDataDecoder extends Decoder {

  constructor(paramsByteArray) {
    super(paramsByteArray);
  }

  /**
   * Decodes a program name from a Uint8Array of bytes.
   * According to the microKORG MIDI Implementation Guide,
   * program names are stored in the first 12 bytes (0-11) of program data,
   * which parse to a string of 12 ASCII characters.
   * 
   * @returns {string} The decoded program name.
   */
  #decodeProgramName() {
    const programNameBytes = this._sliceBytes(0, 12);
    const programName = Formatter.convertBytesToAsciiString(programNameBytes);
    return programName.trim();
  }

  #decodeArpTriggerPattern() {
    const patternMaxLength = 8;
    let byte = this._getByte(15);
    let pattern = [];

    for (let i = 1; i <= patternMaxLength; i++) {
      const step = this._getBooleanParamValue(byte, "lsb", true);
      pattern.push(step);

      byte = ByteManipulator.bitshift(byte, -1);
    }

    return pattern;
  }

  #decodeVoiceMode() {
    const rawByte = this._getByte(16);
    const byte = ByteManipulator.bitshift(rawByte, -4);
    const voiceModeValues = ["Single", "", "Layer", "Vocoder"];
    const voiceModeBitmask = 0x03; // for extracting voice mode (bits 4–5)
    const index = ByteManipulator.extractValueFromByte(byte, voiceModeBitmask);
    if (index === 1) return null;
    return voiceModeValues[index];
  }

  #getModFxType() {
    const index = this._getByte(25);
    const types = ["Flanger/Chorus", "Ensemble", "Phaser"];
    return types[index];

  }

  #decodeModFxSection() {
    const section = new Section("MOD FX");

    section.setParams({
      1: new Param("TYPE", this.#getModFxType()),
      2: new Param("LFO SPEED", this._getByte(23)),
      3: new Param("DEPTH", this._getByte(24))
    });
    
    return section;
  }

  #getDelayType() {
    const index = this._getByte(22);
    const types = ["Stereo Delay", "Cross Delay", "L/R Delay"];
    return types[index];
  }

  #getDelayTimebase(byte) {
    const timebaseValues = [
      "1/32",
      "1/24",
      "1/16",
      "1/12",
      "3/32",
      "1/8",
      "1/6",
      "3/16",
      "1/4",
      "1/3",
      "3/8",
      "1/2",
      "2/3",
      "3/4",
      "1/1"
    ];
    const timebaseBitmask = 0x0F;
    const index = ByteManipulator.extractValueFromByte(byte, timebaseBitmask);
    return timebaseValues[index];
  }

  #decodeDelaySection() {
    const section = new Section("DELAY");

    const timebaseByte = this._getByte(19);
    const timebaseValue = this.#getDelayTimebase(timebaseByte);
    const isSyncEnabled = this._getBooleanParamValue(timebaseByte, "msb");
    const NoteOrTime = (isSyncEnabled ? timebaseValue : this._getByte(20));

    section.setParams({
      1: new Param("TYPE", this.#getDelayType()),
      2: new Param("TEMPO SYNC", isSyncEnabled),
      3: new Param("DELAY TIME / SYNC NOTE", NoteOrTime),
      4: new Param("DELAY DEPTH", this._getByte(21))
    });

    return section;
  }

  #getEqLoBandFreq() {
    const options = [
      "40 Hz",
      "50 Hz",
      "60 Hz",
      "80 Hz",
      "100 Hz",
      "120 Hz",
      "140 Hz",
      "160 Hz",
      "180 Hz",
      "200 Hz",
      "220 Hz",
      "240 Hz",
      "260 Hz",
      "280 Hz",
      "300 Hz",
      "320 Hz",
      "340 Hz",
      "360 Hz",
      "380 Hz",
      "400 Hz",
      "420 Hz",
      "440 Hz",
      "460 Hz",
      "480 Hz",
      "500 Hz",
      "600 Hz",
      "700 Hz",
      "800 Hz",
      "900 Hz",
      "1000 Hz"
    ];
    const index = this._getByte(28);
    return options[index];
  }

  #getEqHiBandFreq() {
    const options = [
      "1 kHz",
      "1.25 kHz",
      "1.5 kHz",
      "1.75 kHz",
      "2 kHz",
      "2.25 kHz",
      "2.5 kHz",
      "2.75 kHz",
      "3 kHz",
      "3.25 kHz",
      "3.5 kHz",
      "3.75 kHz",
      "4 kHz",
      "4.25 kHz",
      "4.5 kHz",
      "4.75 kHz",
      "5 kHz",
      "5.25 kHz",
      "5.5 kHz",
      "5.75 kHz",
      "6 kHz",
      "7 kHz",
      "8 kHz",
      "9 kHz",
      "10 kHz",
      "11 kHz",
      "12 kHz",
      "14 kHz",
      "16 kHz",
      "18 kHz"
    ];
    const index = this._getByte(26);
    return options[index];
  }

  #decodeEqSection() {
    const section = new Section("EQ");

    const loEqGainByte = this._getByte(29);
    const loEqGain = ValueNormalizer.getNormalizedValue(loEqGainByte, 12);

    const hiEqGainByte = this._getByte(27);
    const hiEqGain = ValueNormalizer.getNormalizedValue(hiEqGainByte, 12);

    section.setParams({
      1: new Param("LO EQ FREQ", this.#getEqLoBandFreq()),
      2: new Param("LO EQ GAIN", loEqGain),
      3: new Param("HI EQ FREQ", this.#getEqHiBandFreq()),
      4: new Param("HI EQ GAIN", hiEqGain)
    });

    return section;
  }

  #getArpTempo() {
    // NOTE: This also sets the overall program tempo!
    const bpmByte = this._getByte(30); // 20 - 300
    const seqTempoByte = this._getByte(31);
    return (bpmByte * 256) + seqTempoByte;
  }

  #getArpResolution() {
    const options = [
      "1/24",
      "1/16",
      "1/12",
      "1/8",
      "1/6",
      "1/4"
    ];
    const index = this._getByte(35);
    return options[index];
  }

  #getArpGate() {
    const gateByte = this._getByte(34);
    const rawValue = Math.max(gateByte, 100);
    return Formatter.formatValueAsPercent(rawValue);
  }

  #getArpType() {
    const byte = this._getByte(33);
    const bitmask = 0x0F;
    const options = [
      "Up",
      "Down",
      "Alternate 1",
      "Alternate 2",
      "Random",
      "Trigger"
    ];
    const index = ByteManipulator.extractValueFromByte(byte, bitmask);
    return options[index];
  }

  #getArpRange() {
    const byte = ByteManipulator.bitshift(this._getByte(33), -4);
    const bitmask = 0x03;
    const startValue = 1;
    const rawValue = ByteManipulator.extractValueFromByte(byte, bitmask);
    return rawValue + startValue;
  }

  #decodeArpegA() {
    const section = new Section("ARPEG. A");

    section.setParams({
      1: new Param("TEMPO", this.#getArpTempo()),
      2: new Param("RESOLUTION", this.#getArpResolution()),
      3: new Param("GATE", this.#getArpGate()),
      4: new Param("TYPE", this.#getArpType()),
      5: new Param("RANGE", this.#getArpRange()),
    });

    return section;
  }

  #getArpSwing() {
    let byte = this._getByte(36);
    const rangeLimit = 100;
    const offset = 256;
    if (byte > rangeLimit) byte = ValueNormalizer.getNormalizedValue(byte, offset);
    return Formatter.formatValueAsPercent(byte);
  }

  #getArpLastStep() {
    const byte = this._getByte(14);
    const bitmask = 0x07; // for extracting bits 0–2
    const startValue = 1;
    const actualValue = (
      ByteManipulator.extractValueFromByte(byte, bitmask) + startValue
    );
    return actualValue;
  }

  #getArpTargetTimbre() {
    const byte = ByteManipulator.bitshift(this._getByte(32), -4);
    const bitmask = 0x03;
    const options = ["Both", "Timbre 1", "Timbre 2"];
    const index = ByteManipulator.extractValueFromByte(byte, bitmask);
    return options[index];
  }

  #decodeArpegB() {
    const section = new Section("ARPEG. B");
    const byte = this._getByte(32);

    const isLatchEnabled = this._getBooleanParamValue(byte, 0x40);
    const isKeySynced = this._getBooleanParamValue(byte, "lsb");

    section.setParams({
      1: new Param("LATCH", isLatchEnabled),
      2: new Param("SWING", this.#getArpSwing()),
      3: new Param("KEY SYNC", isKeySynced),
      4: new Param("LAST STEP", this.#getArpLastStep()),
      5: new Param("TARGET TIMBRE", this.#getArpTargetTimbre()),
    });

    return section;
  }

  /**
   * Decodes the Keyboard Octave Shift value.
   * 
   * DISCLAIMER:
   * This is a tricky one. This was not even decoded by the original
   * decoder made by Adam Cooper.
   * 
   * The MIDI Implementation Guide says:
   *   `-3~0~+3 = 3OctDown~normal~3OctUp`
   * ...but there's no clue to decode the actual parameter values.
   * 
   * I've made 7 programs based on the init program, only differing in
   * keyboard octave shift, from -3 to +3, to see each byte value for
   * each keyboard octave shift value. From bass to treble:
   * 
   * - kbd oct shift -3 = 253
   * - kbd oct shift -2 = 254
   * - kbd oct shift -1 = 255
   * - no kbd oct shift = 0
   * - kbd oct shift +1 = 1
   * - kbd oct shift +2 = 2
   * - kbd oct shift +3 = 3
   * 
   * Note the Keyboard Octave Shift parameter cannot be changed on the
   * microKORG SoundEditor utility, but on the microKORG itself.
   * 
   * For now, I'm just going to return the correct value based on this
   * reference, but it should be refactored properly in the future.
   * 
   * @returns {number} The decoded Keyboard Octave Shift value.
   */
  #decodeKeyboardOctaveShift() {
    const byteToValueReference = {
      253: -3,
      254: -2,
      255: -1,
      0: 0,
      1: 1,
      2: 2,
      3: 3
    }
    const index = this._getByte(37);
    return byteToValueReference[index];
  }

  decode() {
    const properties = {
      programName: this.#decodeProgramName(),
      voiceMode: this.#decodeVoiceMode(),
      arpIsEnabled: this._getBooleanParamValue(this._getByte(32), "msb"),
      arpTriggerPattern: this.#decodeArpTriggerPattern(),
      keyboardOctaveShift: this.#decodeKeyboardOctaveShift()
    };

    /**
     * NOTE: Sections 16 to 20 are common to all microKORG programs.
     * Please RTFM for details!
     */
    const sections = {
      16: this.#decodeModFxSection(),
      17: this.#decodeDelaySection(),
      18: this.#decodeEqSection(),
      19: this.#decodeArpegA(),
      20: this.#decodeArpegB()
    };

    return { properties, sections };
  }

}
