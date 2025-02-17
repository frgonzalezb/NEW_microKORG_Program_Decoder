import Program from "../models/Program.js";


export default class ProgramBuilder {

  constructor() {
    this.program = new Program();
  }

  setName(name) {
    this.program.name = name;
    return this;
  }

  setVoiceMode(voiceMode) {
    this.program.voiceMode = voiceMode;
    return this;
  }

  setTimbre1Sections(timbre1Sections) {
    this.program.timbre1Sections = timbre1Sections;
    return this;
  }

  setTimbre2Sections(timbre2Sections) {
    this.program.timbre2Sections = timbre2Sections;
    return this;
  }

  setVocoderSections(vocoderSections) {
    this.program.vocoderSections = vocoderSections;
    return this;
  }

  setGeneralSections(generalSections) {
    this.program.generalSections = generalSections;
    return this;
  }

  setArpeggiatorOnOff(arpIsEnabled) {
    this.program.arpIsEnabled = arpIsEnabled;
    return this;
  }

  setArpeggiatorTriggerPattern(arpTriggerPattern) {
    this.program.arpTriggerPattern = arpTriggerPattern;
    return this;
  }

  setKeyboardOctaveShift(keyboardOctaveShift) {
    this.program.keyboardOctaveShift = keyboardOctaveShift;
    return this;
  }

  getProgram() {
    return this.program;
  }

}
