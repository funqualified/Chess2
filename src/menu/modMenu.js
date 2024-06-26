import { Mods } from "../managers/mods.js";
import { useState } from "react";
import useSound from "use-sound";

import selectSfx from "../assets/Audio/SelectMod.mp3";
import deselectSfx from "../assets/Audio/DeselectMod.mp3";

const ModMenu = (props) => {
  const [playSelect] = useSound(selectSfx, { volume: 0.25 });
  const [playDeselect] = useSound(deselectSfx, { volume: 0.25 });
  const [selectedMods, setSelectedMods] = useState([]);

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
      playDeselect();
    } else {
      playSelect();
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
