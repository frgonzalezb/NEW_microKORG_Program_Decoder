/**
 * NOTE: The complete reference for all this can be found in the
 * microKORG MIDI Implementation Guide, specifically in the
 * TABLE 3 : VOCODER PARAMETER
 */

import { ByteManipulator, ValueNormalizer, JsonHelper } from "../utils/Utilities.js";
import Decoder from "./Decoder.js";
import Section from "../models/Section.js";
import Param from "../models/Param.js";


export default class VocoderDataDecoder extends Decoder {

  constructor(dataByteArray, voiceMode) {
    super(dataByteArray);
    this.voiceMode = voiceMode;
  }

  #breakdownVoiceMode() {
    const vocoderProgram = ["Vocoder", "Single"];
    const synthSingleProgram = ["Synth", "Single"];
    const synthLayerProgram = ["Synth", "Layer"];
    if (this.voiceMode === "Vocoder") return vocoderProgram;
    return (this.voiceMode === "Single")
      ? synthSingleProgram
      : synthLayerProgram;
  }

  #getVoiceAssign(byte) {
    const bitshift = -6;
    const bitmask = 0x03;
    const options = ["Mono", "Poly", "Unison"];
    return ByteManipulator.selectOptionFromByte(byte, options, bitmask, bitshift);
  }

  #getTriggerMode(byte) {
    const bitshift = -3;
    const bitmask = "lsb";
    const options = ["Single", "Multi"];
    return ByteManipulator.selectOptionFromByte(byte, options, bitmask, bitshift);
  }

  #decodeVoiceSection() {
    const section = new Section("VOICE");

    const voiceAssignTriggerModeByte = this._getByte(1);

    const [synthOrVocoder, singleOrLayer] = this.#breakdownVoiceMode();
    const voiceAssign = this.#getVoiceAssign(voiceAssignTriggerModeByte);
    const triggerMode = (voiceAssign !== "Poly")
      ? this.#getTriggerMode(voiceAssignTriggerModeByte)
      : "- - -";
    const unisonDetune = (voiceAssign === "Unison")
      ? this._getByte(2) :
      "- - -";

    section.setParams({
      1: new Param("SYNTH/VOCODER", synthOrVocoder),
      2: new Param("SINGLE/LAYER", singleOrLayer),
      3: new Param("VOICE ASSIGN", voiceAssign),
      4: new Param("TRIGGER MODE", triggerMode),
      5: new Param("UNISON DETUNE", unisonDetune),
    });

    return section;
  }

  #decodePitchSection() {
    const section = new Section("PITCH");

    const transpose = ValueNormalizer.getNormalizedValue(this._getByte(5), 24);
    const tune = ValueNormalizer.getNormalizedValue(this._getByte(3), 50);
    const portamento = this._getByte(15);
    const bendRange = ValueNormalizer.getNormalizedValue(this._getByte(4), 12);
    const vibratoInt = ValueNormalizer.getNormalizedValue(this._getByte(6));

    section.setParams({
      1: new Param("TRANSPOSE", transpose),
      2: new Param("TUNE", tune),
      3: new Param("PORTAMENTO", portamento),
      4: new Param("BEND RANGE", bendRange),
      5: new Param("VIBRATO INT", vibratoInt),
    });

    return section;
  }

  #getOsc1Wave() {
    const byte = this._getByte(7);
    const bitmask = 0x07;
    const options = [
      "Saw",
      "Square",
      "Triangle",
      "Sine",
      "Vox",
      "DWGS",
      "Noise",
      "Audio In"
    ];
    return ByteManipulator.selectOptionFromByte(byte, options, bitmask);
  }

  async #getControlsForOsc1(wave) {
    const [ctrl1, ctrl2, dwgsIndex] = this._sliceBytes(8, 11);
    if (wave === "DWGS") {
      const dwgsName = await this.#getDwgsName(dwgsIndex);
      const dwgsObj = { dwgsIndex, dwgsName };
      return ["- - -", dwgsObj];
    }
    return [ctrl1, ctrl2];
  }

  async #getDwgsName(dwgsIndex) {
    const filePath = "../app/assets/json/dwgs_list.json";
    const dwgsList = await JsonHelper.retrieveDataFromJson(filePath);
    return dwgsList[dwgsIndex];
  }

  async #decodeOsc1Section() {
    const section = new Section("OSC 1");

    const wave = this.#getOsc1Wave();
    const [ctrl1, ctrl2] = await this.#getControlsForOsc1(wave);

    section.setParams({
      1: new Param("WAVE", wave),
      2: new Param("CONTROL 1", ctrl1),
      3: new Param("CONTROL 2", ctrl2)
    });

    return section;
  }

  #decodeAudioIn1Section() {
    const section = new Section("AUDIO IN 1");

    const gateSense = this._getByte(19);
    const threshold = this._getByte(20);
    const hpfLevel = this._getByte(18);

    const hpfGateByte = this._getByte(12);
    const hpfGate = this._getBooleanParamValue(hpfGateByte, "lsb");

    section.setParams({
      1: new Param("GATE SENSE", gateSense),
      2: new Param("THRESHOLD", threshold),
      3: new Param("HPF LEVEL", hpfLevel),
      4: new Param("HPF GATE", hpfGate)
    });

    return section;
  }

  #decodeMixerSection() {
    const section = new Section("MIXER");

    const osc1Level = this._getByte(15);
    const instLevel = this._getByte(16);
    const noiseLevel = this._getByte(17);

    section.setParams({
      1: new Param("OSC 1 LEVEL", osc1Level),
      2: new Param("INST LEVEL", instLevel),
      3: new Param("NOISE LEVEL", noiseLevel)
    });

    return section;
  }

  #getFormantShift() {
    const options = ["0", "1", "2", "-1", "-2"];
    const index = this._getByte(21);
    return options[index];
  }

  #getEfSense() {
    const byte = this._getByte(26);
    return (byte === 127) ? "Hold" : byte;
  }

  #decodeFilterSection() {
    const section = new Section("FILTER");

    const formantShift = this.#getFormantShift();

    const cutoffByte = this._getByte(22);
    const cutoff = ValueNormalizer.getNormalizedValue(cutoffByte);

    const resonance = this._getByte(23);
    const efSense = this.#getEfSense();

    section.setParams({
      1: new Param("FORMANT SHIFT", formantShift),
      2: new Param("CUTOFF", cutoff),
      3: new Param("RESONANCE", resonance),
      4: new Param("E.F. SENSE", efSense)
    });

    return section;
  }

  #getFcModSource() {
    const options = [
      "Amp EG",
      "LFO 1",
      "LFO 2",
      "Velocity",
      "Keyboard Track",
      "Pitch Bend",
      "Mod. Wheel"
    ];
    const index = this._getByte(24);
    return options[index];
  }

  #decodeFcModSection() {
    const section = new Section("FC MOD");

    const source = this.#getFcModSource();

    const intensityByte = this._getByte(25);
    const intensity = ValueNormalizer.getNormalizedValue(intensityByte);

    section.setParams({
      1: new Param("SOURCE", source),
      2: new Param("INTENSITY", intensity)
    });

    return section;
  }

  #decodeAmpSection() {
    const section = new Section("AMP");
    
    const level = this._getByte(27);
    const directLevel = this._getByte(28);

    const distortionByte = this._getByte(29);
    const distortion = this._getBooleanParamValue(distortionByte, "lsb");

    const kbdTrackByte = this._getByte(31);
    const kbdTrack = ValueNormalizer.getNormalizedValue(kbdTrackByte);

    section.setParams({
      1: new Param("LEVEL", level),
      2: new Param("DIRECT LEVEL", directLevel),
      3: new Param("DISTORTION", distortion),
      4: new Param("KBD TRACK", kbdTrack)
    });

    return section;
  }

  #decodeAmpEgSection() {
    const section = new Section("AMP EG");
    
    const attack = this._getByte(36);
    const decay = this._getByte(37);
    const sustain = this._getByte(38);
    const release = this._getByte(39);
    const egReset = this._getBooleanParamValue(this._getByte(1), 0x20);

    section.setParams({
      1: new Param("ATTACK", attack),
      2: new Param("DECAY", decay),
      3: new Param("SUSTAIN", sustain),
      4: new Param("RELEASE", release),
      5: new Param("EG RESET", egReset)
    });

    return section;
  }

  #getLfoWave(lfoNumber, byte) {
    const bitmask = 0x03;
    const options = (lfoNumber === 1)
      ? ["Saw", "Square 1", "Triangle", "Sample & Hold"]
      : ["Saw", "Square 2", "Sine", "Sample & Hold"];
    return ByteManipulator.selectOptionFromByte(byte, options, bitmask);
  }

  #getLfoKeySync(byte) {
    const bitmask = 0x03;
    const bitshift = -4;
    const options = ["OFF", "Timbre", "Voice"];
    return ByteManipulator.selectOptionFromByte(byte, options, bitmask, bitshift);

  }

  #getLfoSyncNote(byte) {
    const bitmask = 0x0F;
    const options = [
      "1/1",
      "3/4",
      "2/3",
      "1/2",
      "3/8",
      "1/3",
      "1/4",
      "3/16",
      "1/6",
      "1/8",
      "3/32",
      "1/12",
      "1/16",
      "1/24",
      "1/32"
    ];
    return ByteManipulator.selectOptionFromByte(byte, options, bitmask);
  }

  #decodeLfoSection(lfoNumber) {
    const section = new Section(`LFO ${lfoNumber}`);

    const waveKeySyncBytes = [40, 43];
    const frequencyBytes = [41, 44];
    const tempoSyncNoteBytes = [42, 45];

    const waveKeySyncByte = this._getByte(waveKeySyncBytes[lfoNumber - 1]);
    const frequencyByte = this._getByte(frequencyBytes[lfoNumber - 1]);
    const tempoSyncNoteByte = this._getByte(tempoSyncNoteBytes[lfoNumber - 1]);

    const wave = this.#getLfoWave(lfoNumber, waveKeySyncByte);
    const keySync = this.#getLfoKeySync(waveKeySyncByte);
    const tempoSync = this._getBooleanParamValue(tempoSyncNoteByte, "msb");
    const frequencyOrSyncNote = tempoSync
      ? this.#getLfoSyncNote(tempoSyncNoteByte)
      : frequencyByte;

    section.setParams({
      1: new Param("WAVE", wave),
      2: new Param("KEY SYNC", keySync),
      3: new Param("TEMPO SYNC", tempoSync),
      4: new Param("FREQUENCY / SYNC NOTE", frequencyOrSyncNote)
    });

    return section;
  }

  #decodeChLevelASection() {
    const section = new Section("CH LEVEL A");

    const ch1Level = this._getByte(46);
    const ch2Level = this._getByte(48);
    const ch3Level = this._getByte(50);
    const ch4Level = this._getByte(52);

    section.setParams({
      1: new Param("CH 1 LEVEL", ch1Level),
      2: new Param("CH 2 LEVEL", ch2Level),
      3: new Param("CH 3 LEVEL", ch3Level),
      4: new Param("CH 4 LEVEL", ch4Level)
    });

    return section;
  }

  #decodeChLevelBSection() {
    const section = new Section("CH LEVEL B");

    const ch5Level = this._getByte(54);
    const ch6Level = this._getByte(56);
    const ch7Level = this._getByte(58);
    const ch8Level = this._getByte(60);

    section.setParams({
      1: new Param("CH 5 LEVEL", ch5Level),
      2: new Param("CH 6 LEVEL", ch6Level),
      3: new Param("CH 7 LEVEL", ch7Level),
      4: new Param("CH 8 LEVEL", ch8Level)
    });

    return section;
  }

  #formatPanpotValue(value) {
    if (value == 0) return "cnt";
    if (value < 0) return "L" + Math.abs(value);
    return "R" + value;
  }
  
  #getPanpotValue(rawValue) {
    const normalizedValue = ValueNormalizer.getNormalizedValue(rawValue);
    return this.#formatPanpotValue(normalizedValue);
  }

  #decodeChPanASection() {
    const section = new Section("CH PAN A");

    const ch1Pan = this.#getPanpotValue(62);
    const ch2Pan = this.#getPanpotValue(64);
    const ch3Pan = this.#getPanpotValue(66);
    const ch4Pan = this.#getPanpotValue(68);

    section.setParams({
      1: new Param("CH 1 PAN", ch1Pan),
      2: new Param("CH 2 PAN", ch2Pan),
      3: new Param("CH 3 PAN", ch3Pan),
      4: new Param("CH 4 PAN", ch4Pan)
    });

    return section;
  }

  #decodeChPanBSection() {
    const section = new Section("CH PAN B");

    const ch5Pan = this.#getPanpotValue(70);
    const ch6Pan = this.#getPanpotValue(72);
    const ch7Pan = this.#getPanpotValue(74);
    const ch8Pan = this.#getPanpotValue(76);

    section.setParams({
      1: new Param("CH 5 PAN", ch5Pan),
      2: new Param("CH 6 PAN", ch6Pan),
      3: new Param("CH 7 PAN", ch7Pan),
      4: new Param("CH 8 PAN", ch8Pan)
    });

    return section;
  }

  async decode() {
    return {
      1: this.#decodeVoiceSection(),
      2: this.#decodePitchSection(),
      3: await this.#decodeOsc1Section(),
      4: this.#decodeAudioIn1Section(),
      5: this.#decodeMixerSection(),
      6: this.#decodeFilterSection(),
      7: this.#decodeFcModSection(),
      8: this.#decodeAmpSection(),
      9: this.#decodeAmpEgSection(),
      10: this.#decodeLfoSection(1),
      11: this.#decodeLfoSection(2),
      12: this.#decodeChLevelASection(),
      13: this.#decodeChLevelBSection(),
      14: this.#decodeChPanASection(),
      15: this.#decodeChPanBSection(),
    };
  }

}
