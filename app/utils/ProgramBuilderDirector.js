import ProgramBuilder from "./ProgramBuilder.js";


export default class ProgramBuilderDirector {

  constructor() {
    this.builder = new ProgramBuilder();
  }

  buildVocoderProgram(decodedData) {
    const name = decodedData.general.properties.programName;
    const voiceMode = decodedData.general.properties.voiceMode;
    const vocoderSections = decodedData.vocoder;
    const generalSections = decodedData.general.sections;
    const arpOnOff = decodedData.general.properties.arpIsEnabled;
    const arpTriggerPattern = decodedData.general.properties.arpTriggerPattern;
    const keyboardOctaveShift = decodedData.general.properties.keyboardOctaveShift;

    return this.builder
      .setName(name)
      .setVoiceMode(voiceMode)
      .setVocoderSections(vocoderSections)
      .setGeneralSections(generalSections)
      .setArpeggiatorOnOff(arpOnOff)
      .setArpeggiatorTriggerPattern(arpTriggerPattern)
      .setKeyboardOctaveShift(keyboardOctaveShift)
      .getProgram();
  }

  buildSynthSingleProgram(decodedData) {
    const name = decodedData.general.properties.programName;
    const voiceMode = decodedData.general.properties.voiceMode;
    const timbre1Sections = decodedData.timbre1;
    const generalSections = decodedData.general.sections;
    const arpOnOff = decodedData.general.properties.arpIsEnabled;
    const arpTriggerPattern = decodedData.general.properties.arpTriggerPattern;
    const keyboardOctaveShift = decodedData.general.properties.keyboardOctaveShift;

    return this.builder
      .setName(name)
      .setVoiceMode(voiceMode)
      .setTimbre1Sections(timbre1Sections)
      .setGeneralSections(generalSections)
      .setArpeggiatorOnOff(arpOnOff)
      .setArpeggiatorTriggerPattern(arpTriggerPattern)
      .setKeyboardOctaveShift(keyboardOctaveShift)
      .getProgram();
  }

  buildSynthLayerProgram(decodedData) {
    const name = decodedData.general.properties.programName;
    const voiceMode = decodedData.general.properties.voiceMode;
    const timbre1Sections = decodedData.timbre1;
    const timbre2Sections = decodedData.timbre2;
    const generalSections = decodedData.general.sections;
    const arpOnOff = decodedData.general.properties.arpIsEnabled;
    const arpTriggerPattern = decodedData.general.properties.arpTriggerPattern;
    const keyboardOctaveShift = decodedData.general.properties.keyboardOctaveShift;

    return this.builder
      .setName(name)
      .setVoiceMode(voiceMode)
      .setTimbre1Sections(timbre1Sections)
      .setTimbre2Sections(timbre2Sections)
      .setGeneralSections(generalSections)
      .setArpeggiatorOnOff(arpOnOff)
      .setArpeggiatorTriggerPattern(arpTriggerPattern)
      .setKeyboardOctaveShift(keyboardOctaveShift)
      .getProgram();
  }

}
