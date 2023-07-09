import Title from "./title";
import ModManager from "./modManager";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Chess from "../game/chess2";
import Multiplayer from "../game/multiplayer";

const MainMenu = (props) => {
  const [activeMods, setActiveMods] = useState([]);
  const [peerId, setPeerId] = useState("");
  const navigate = useNavigate();

  function beginSingleplayer() {
    Chess().init(activeMods, "white");
    navigate("/match");
  }

  function hostMultiplayer() {
    Chess().init(activeMods, "white");
    props.setMultiplayer(true);
    Multiplayer().hostGame();
    navigate("/match");
  }

  function joinMultiplayer() {
    Multiplayer().startGame = handleGameJoined;
    Multiplayer().joinGame(peerId);
  }

  function handleModsChanged(mods) {
    setActiveMods(mods);
  }

  function handlePeerIdChanged(event) {
    setPeerId(event.target.value);
  }

  function handleGameJoined(mods, color) {
    Chess().init(mods, color);
    props.setMultiplayer(true);
    navigate("/match");
  }

  return (
    <div id="menu-space" className="menu">
      <Title />
      <button onClick={beginSingleplayer}>Single Player</button>
      <button onClick={hostMultiplayer}>Host Game</button>
      <br />
      <input name="PeerId" defaultValue="" onChange={handlePeerIdChanged} placeholder="enter Peer id to connect" />
      <button onClick={joinMultiplayer}>Join Game</button>
      <p>Select all mods you want to use.</p>
      <div id="mod-selector">
        <ModManager handleModsChanged={handleModsChanged} />
      </div>
      <br />
    </div>
  );
};

export default MainMenu;
