import { Mods } from "../game/mods.js";
import { useState } from "react";

const ModMenu = (props) => {
  const [selectedMods, setSelectedMods] = useState([]);

  function convertToCapitalCase(str) {
    // Replace underscores with spaces
    str = str.replace(/_/g, " ");

    // Convert to capital case
    str = str.toLowerCase().replace(/(?:^|\s)\w/g, function (match) {
      return match.toUpperCase();
    });

    return str;
  }

  function spiciness() {
    let spice = 0;
    selectedMods.forEach((mod) => {
      var spiceToAdd = Mods.find((m) => m.uid === mod).spice;
      spice += spiceToAdd;
    });
    return spice;
  }

  function handleCheckboxChange(event) {
    let newArray = [...selectedMods, event.target.value];
    if (selectedMods.includes(event.target.value)) {
      newArray = newArray.filter((mod) => mod !== event.target.value);
    }
    setSelectedMods(newArray);
    props.handleModsChanged(newArray);
  }

  const modList = [];
  Mods.forEach((mod) => {
    modList.push(
      <span className="modItem" key={mod.uid} title={mod.name}>
        <input onChange={handleCheckboxChange} type="checkbox" name="mods" value={mod.uid} /> <label className="modLabel">{mod.name}</label>
      </span>
    );
  });
  const returnValue = (
    <div id="mod-selector">
      {modList}
      <div className="spice-meter">{spiciness()}</div>
    </div>
  );
  return returnValue;
};

export default ModMenu;
