/**
 * NOTE: The complete reference for all this can be found in the
 * microKORG MIDI Implementation Guide, specifically in the
 * TABLE 2 : SYNTH PARAMETER ( 1 TIMBRE )
 */

import { ByteManipulator, ValueNormalizer, JsonHelper } from "../utils/Utilities.js";
import Decoder from "./Decoder.js";
import Section from "../models/Section.js";
import Param from "../models/Param.js";


export default class SynthDataDecoder extends Decoder {

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

  #getOsc2Wave(byte, bitmask) {
    const options = ["Saw", "Square", "Triangle"];
    return ByteManipulator.selectOptionFromByte(byte, options, bitmask);
  }

  #getOsc2Mod(byte, bitmask) {
    const bitshift = -4;
    const options = ["OFF", "Ring", "Sync", "Ring-Sync"];
    return ByteManipulator.selectOptionFromByte(byte, options, bitmask, bitshift);
  }

  #decodeOsc2Section() {
    const section = new Section("OSC 2");

    const osc2WaveModByte = this._getByte(12);
    const osc2WaveModBitmask = 0x03;

    const wave = this.#getOsc2Wave(osc2WaveModByte, osc2WaveModBitmask);
    const mod = this.#getOsc2Mod(osc2WaveModByte, osc2WaveModBitmask);
    const semitone = ValueNormalizer.getNormalizedValue(this._getByte(13), 24);
    const tune = ValueNormalizer.getNormalizedValue(this._getByte(14));

    section.setParams({
      1: new Param("WAVE", wave),
      2: new Param("OSC MOD", mod),
      3: new Param("SEMITONE", semitone),
      4: new Param("TUNE", tune)
    });

    return section;
  }

  #decodeMixerSection() {
    const section = new Section("MIXER");

    section.setParams({
      1: new Param("OSC 1 LEVEL", this._getByte(16)),
      2: new Param("OSC 2 LEVEL", this._getByte(17)),
      3: new Param("NOISE LEVEL", this._getByte(18))
    });

    return section;
  }

  #getFilterType() {
    const options = [
      "-24 dB LPF",
      "-12 dB LPF",
      "-12 dB BPF",
      "-12 dB HPF"
    ];
    const index = this._getByte(19);
    return options[index];
  }

  #decodeFilterSection() {
    const section = new Section("FILTER");

    const type = this.#getFilterType();
    const cutoff = this._getByte(20);
    const resonance = this._getByte(21);
    const filterEgInt = ValueNormalizer.getNormalizedValue(this._getByte(22));
    const filterKeyTrack = ValueNormalizer.getNormalizedValue(this._getByte(24));

    section.setParams({
      1: new Param("TYPE", type),
      2: new Param("CUTOFF", cutoff),
      3: new Param("RESONANCE", resonance),
      4: new Param("FILTER EG INT", filterEgInt),
      5: new Param("FILTER KEY TRACK", filterKeyTrack)
    });

    return section;
  }

  #decodeFilterEgSection() {
    const section = new Section("FILTER EG");
    
    const attack = this._getByte(30);
    const decay = this._getByte(31);
    const sustain = this._getByte(32);
    const release = this._getByte(33);
    const egReset = this._getBooleanParamValue(this._getByte(1), 0x10);

    section.setParams({
      1: new Param("ATTACK", attack),
      2: new Param("DECAY", decay),
      3: new Param("SUSTAIN", sustain),
      4: new Param("RELEASE", release),
      5: new Param("EG RESET", egReset)
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

  #decodeAmpSection() {
    const section = new Section("AMP");

    const level = this._getByte(25);
    const panpot = this.#getPanpotValue(this._getByte(26));
    const distortion = this._getBooleanParamValue(this._getByte(27), "lsb");
    const kbdTrack = ValueNormalizer.getNormalizedValue(this._getByte(29));

    section.setParams({
      1: new Param("LEVEL", level),
      2: new Param("PANPOT", panpot),
      3: new Param("DISTORTION", distortion),
      4: new Param("KBD TRACK", kbdTrack)
    });

    return section;
  }

  #decodeAmpEgSection() {
    const section = new Section("AMP EG");
    
    const attack = this._getByte(34);
    const decay = this._getByte(35);
    const sustain = this._getByte(36);
    const release = this._getByte(37);
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

    const waveKeySyncBytes = [38, 41];
    const frequencyBytes = [39, 42];
    const tempoSyncNoteBytes = [40, 43];

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

  #getPatchSource(byte) {
    const bitmask = 0x0F;
    const options = [
      "Filter EG",
      "Amp EG",
      "LFO 1",
      "LFO 2",
      "Velocity",
      "Keyboard Track",
      "Pitch Bend",
      "Mod. Wheel"
    ];
    return ByteManipulator.selectOptionFromByte(byte, options, bitmask);
  }

  #getPatchDestination(byte) {
    const bitmask = 0x0F;
    const bitshift = -4;
    const options = [
      "Pitch",
      "OSC 2 Tune",
      "OSC 1 Control 1",
      "Noise Level",
      "Cutoff",
      "Amp Level",
      "Pan",
      "LFO 2 Frequency"
    ];
    return ByteManipulator.selectOptionFromByte(byte, options, bitmask, bitshift);
  }

  #decodePatchSection(patchNumber) {
    const section = new Section(`PATCH ${patchNumber}`);

    const sourceDestBytes = [44, 46, 48, 50];
    const modIntBytes = [45, 47, 49, 51];

    const sourceDestByte = this._getByte(sourceDestBytes[patchNumber - 1]);
    const modIntByte = this._getByte(modIntBytes[patchNumber - 1]);

    const source = this.#getPatchSource(sourceDestByte);
    const dest = this.#getPatchDestination(sourceDestByte);
    const modInt = ValueNormalizer.getNormalizedValue(modIntByte);

    section.setParams({
      1: new Param("SOURCE", source),
      2: new Param("DEST", dest),
      3: new Param("MOD INT", modInt)
    });

    return section;
  }

  async decode() {
    return {
      1: this.#decodeVoiceSection(),
      2: this.#decodePitchSection(),
      3: await this.#decodeOsc1Section(),
      4: this.#decodeOsc2Section(),
      5: this.#decodeMixerSection(),
      6: this.#decodeFilterSection(),
      7: this.#decodeFilterEgSection(),
      8: this.#decodeAmpSection(),
      9: this.#decodeAmpEgSection(),
      10: this.#decodeLfoSection(1),
      11: this.#decodeLfoSection(2),
      12: this.#decodePatchSection(1),
      13: this.#decodePatchSection(2),
      14: this.#decodePatchSection(3),
      15: this.#decodePatchSection(4),
    };
  }

}
