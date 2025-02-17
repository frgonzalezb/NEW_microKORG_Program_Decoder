export default class Program {

  constructor() {
    this.name = "";
    this.voiceMode = "";
    this.timbre1Sections = {};
    this.timbre2Sections = {};
    this.vocoderSections = {};
    this.generalSections = {}; // they're actually last in the workflow!
    this.arpIsEnabled = false;
    this.arpTriggerPattern = [];
    this.keyboardOctaveShift = 0;
  }

  describe() {
    console.info(
      "### microKORG Program Summary ###\n\n",
      `- Name: ${this.name}\n`,
      `- Voice mode: ${this.voiceMode}\n`,
      `- Timbre 1 sections:`, this.timbre1Sections, `\n`,
      `- Timbre 2 sections:`, this.timbre2Sections, `\n`,
      `- Vocoder sections:`, this.vocoderSections, `\n`,
      `- General sections:`, this.generalSections, `\n`,
      `- Is arpeggiator enabled?: ${this.arpIsEnabled}\n`,
      `- Arpeggiator trigger pattern: ${this.arpTriggerPattern}\n`,
      `- Keyboard octave shift: ${this.keyboardOctaveShift}\n\n`
    );
  }

}
