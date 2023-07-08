import { GameTags } from "../game/chess2";
import { useState } from "react";

const ModManager = (props) => {
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

  function handleCheckboxChange(event) {
    let newArray = [...selectedMods, event.target.value];
    if (selectedMods.includes(event.target.value)) {
      newArray = newArray.filter((mod) => mod !== event.target.value);
    }
    setSelectedMods(newArray);
    props.handleModsChanged(newArray);
  }

  const returnArray = [];
  Object.keys(GameTags).forEach(function (key, index) {
    returnArray.push(
      <span key={key} title={GameTags[key]}>
        <input onChange={handleCheckboxChange} type="checkbox" name="mods" value={GameTags[key]} /> <label> {convertToCapitalCase(key)}</label>
      </span>
    );
  });
  return returnArray;
};

export default ModManager;
