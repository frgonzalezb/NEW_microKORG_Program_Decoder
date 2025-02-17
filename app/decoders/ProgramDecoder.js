import Decoder from "./Decoder.js";
import GeneralDataDecoder from "./GeneralDataDecoder.js";
import SynthDataDecoder from "./SynthDataDecoder.js";
import VocoderDataDecoder from "./VocoderDataDecoder.js";

import ProgramBuilderDirector from "../utils/ProgramBuilderDirector.js";


export default class ProgramDecoder extends Decoder {

  #rawProgramObj = {};

  constructor(rawProgramData) {
    super(rawProgramData);
    this.rawProgramData = rawProgramData;
  }

  // Private helper methods

  #decodeGeneralData() {
    const generalData = this._sliceBytes(0, 38);
    const generalDataDecoder = new GeneralDataDecoder(generalData);
    this.#rawProgramObj["general"] = generalDataDecoder.decode();
  }

  async #decodeVocoderData(voiceMode) {
    const vocoderData = this._sliceBytes(38, 142);
    const vocoderDecoder = new VocoderDataDecoder(vocoderData, voiceMode);
    this.#rawProgramObj["vocoder"] = await vocoderDecoder.decode();
  }

  async #decodeTimbre1Data(voiceMode) {
    const timbre1Data = this._sliceBytes(38, 146);
    const timbre1Decoder = new SynthDataDecoder(timbre1Data, voiceMode);
    this.#rawProgramObj["timbre1"] = await timbre1Decoder.decode();
  }

  async #decodeTimbre2Data(voiceMode) {
    const timbre2Data = this._sliceBytes(146, 254);
    const timbre2Decoder = new SynthDataDecoder(timbre2Data, voiceMode);
    this.#rawProgramObj["timbre2"] = await timbre2Decoder.decode();
  }

  // Public methods

  async decode() {
    const director = new ProgramBuilderDirector();

    this.#decodeGeneralData();

    const { voiceMode } = this.#rawProgramObj.general.properties;

    if (voiceMode === "Vocoder") {
      await this.#decodeVocoderData(voiceMode);
      return director.buildVocoderProgram(this.#rawProgramObj);
    }

    await this.#decodeTimbre1Data(voiceMode);

    if (voiceMode === "Single") {
      return director.buildSynthSingleProgram(this.#rawProgramObj);
    }

    await this.#decodeTimbre2Data(voiceMode);

    return director.buildSynthLayerProgram(this.#rawProgramObj);
  }

}
