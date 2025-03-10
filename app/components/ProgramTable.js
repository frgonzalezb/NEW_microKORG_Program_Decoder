export default class ProgramTable {

  constructor(programObj) {
    this.programObj = programObj;
    this.container = document.getElementById("programDataContent");
  }

  displayProgramName() {
    const container = document.getElementById("programTitle");
    if (container.hasChildNodes()) container.innerHTML = "";
    const element = document.createElement("h2");
    const programName = this.programObj.name;
    if (programName === "") element.title = "This program has no name 🤷‍♂️";
    element.innerHTML = "Program: " + programName;
    container.appendChild(element);
    container.hidden = false;
  }

  createTableSubtitle(text) {
    const subtitleElement = document.createElement("h3");
    const subtitleText = document.createTextNode(text);
    subtitleElement.appendChild(subtitleText);
    return subtitleElement;
  }

  createTableHeader() {
    const thead = document.createElement("thead");
    const tr = document.createElement("tr");

    const headerContent = [
      "",
      "1",
      "2",
      "3",
      "4",
      "5"
    ];

    for (let i = 0; i < headerContent.length; i++) {
      const th = document.createElement("th");
      th.scope = "col";
      th.classList.add("col-2");
      th.style.minWidth = "100%";
      th.innerHTML = headerContent[i];
      tr.appendChild(th);
    }

    thead.appendChild(tr);

    return thead;
  }

  formatBooleanValue(value, emojis = false) {
    if (emojis) return value ? "✔️" : "❌";
    return value ? "ON" : "OFF";
  }

  formatDwgsValue(value) {
    return `${value.dwgsIndex}. ${value.dwgsName}`;
  }

  formatArpTriggerPattern() {
    const arpTriggerPattern = this.programObj.arpTriggerPattern;
    let formattedPattern = "";
    for (let i = 0; i < arpTriggerPattern.length; i++) {
      const value = this.formatBooleanValue(arpTriggerPattern[i], true);
      if (i === arpTriggerPattern.length - 1) {
        formattedPattern += value;
        break;
      }
      formattedPattern += value;
    }
    return formattedPattern;
  }

  createTableBodyCell(index, sectionObj) {
    const td = document.createElement("td");
    if (sectionObj.params[index] === undefined) {
      td.innerHTML = "- - -";
      return td;
    };

    const parameterName = sectionObj.params[index].name;
    td.title = `Parameter: ${parameterName}`;
    
    let parameterValue = sectionObj.params[index].value;
    if (typeof parameterValue === "boolean") {
      parameterValue = this.formatBooleanValue(parameterValue);
    }
    if (parameterName === "CONTROL 2" && typeof parameterValue === "object") {
      parameterValue = this.formatDwgsValue(parameterValue);
    }
    td.innerHTML = parameterValue;

    return td;
  }

  createTableBodyRow(sectionObj) {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.scope = "row";
    th.classList.add("text-start");
    th.innerHTML = sectionObj.name;
    tr.appendChild(th);

    // microKORG has 5 knobs to control up to 5 parameters per section
    for (let knob = 1; knob <= 5; knob++) {
      const td = this.createTableBodyCell(knob, sectionObj);
      tr.appendChild(td);
    }

    return tr;
  }

  formatKeyboardOctaveShift() {
    const value = this.programObj.keyboardOctaveShift;
    if (value === 0) return value;
    return value > 0 ? `🔺${value}` : `🔻${value}`;
  }

  appendAdditionalParams() {
    const div = document.createElement("div");
    div.classList.add("text-start");
    const subtitle = this.createTableSubtitle(
      "Additional Parameters"
    );
    const listObj = document.createElement("ul");
    const arpIsEnabled = this.programObj.arpIsEnabled;
    const additionalParams = {
      "Arpeggiator On/Off": this.formatBooleanValue(arpIsEnabled),
      "Arpeggiator trigger pattern": this.formatArpTriggerPattern(),
      "Keyboard octave shift": this.formatKeyboardOctaveShift()
    };

    for (const [key, value] of Object.entries(additionalParams)) {
      const listItem = document.createElement("li");
      const blackText = document.createElement("b");
      blackText.innerHTML = key + ": ";
      listItem.appendChild(blackText);
      listItem.innerHTML += value;
      listObj.appendChild(listItem);
    }

    div.appendChild(subtitle);
    div.appendChild(listObj);

    return div;
  }

  deleteProgramDataPlaceholder() {
    const programDataPlaceholder = document.getElementById(
      "programDataPlaceholder"
    );
    if (programDataPlaceholder) programDataPlaceholder.remove();
  }

  toggleTables(hidden = false) {
    document.getElementById("programData").hidden = hidden;
    document.getElementById("programDataContent").hidden = hidden;
  }

  toggleTimbre2Tab(enabled = true) {
    const element = document.getElementById("pillsTimbre2Tab");
    if (!enabled) element.setAttribute("disabled", "");
    else element.removeAttribute("disabled");
  }

  createTableBody(sectionsGroup) {
    let tbody = document.createElement("tbody");
    tbody.className = "table-group-divider";

    for (const [_, sectionObj] of Object.entries(sectionsGroup)) {
      const tr = this.createTableBodyRow(sectionObj);
      tbody.appendChild(tr);
    }

    return tbody;
  }

  getSortedDataByContainer() {
    const voiceMode = this.programObj.voiceMode;

    const pillsTimbre1Data = (voiceMode === "Vocoder")
      ? this.programObj.vocoderSections
      : this.programObj.timbre1Sections;

    const pillsTimbre12ata = (voiceMode === "Layer")
      ? this.programObj.timbre2Sections
      : null;

    const generalData = this.programObj.generalSections;

    return {
      "timbre1Tab": pillsTimbre1Data,
      "timbre2Tab": pillsTimbre12ata,
      "fxArpTab": generalData
    };
  }

  setTables() {
    const data = this.getSortedDataByContainer();

    for (const [id, sections] of Object.entries(data)) {
      if (id === "timbre2Tab" && !sections) {
        this.toggleTimbre2Tab(false);
        continue
      };

      const container = document.getElementById(id);
      if (container.hasChildNodes()) container.innerHTML = "";

      const table = document.createElement("table");
      table.classList.add(
        "table",
        "table-sm",
        "table-striped",
        "table-hover",
        "text-center"
      );
      const thead = this.createTableHeader();
      const tbody = this.createTableBody(sections);

      table.appendChild(thead);
      table.appendChild(tbody);

      container.appendChild(table);

      if (id === "fxArpTab") {
        const additionalParams = this.appendAdditionalParams();
        container.appendChild(additionalParams);
      }
    }
  }

  resetContainer() {
    this.toggleTables(true);
    this.toggleTimbre2Tab()
  }

}
