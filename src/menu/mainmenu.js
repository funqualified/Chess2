import Title from "./title";
import ModManager from "./modManager";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Chess from "../game/chess2";
import Multiplayer from "../game/multiplayer";

const MainMenu = (props) => {
  const [activeMods, setActiveMods] = useState([]);
  const [openGames, setOpenGames] = useState([]);
  const [username, setUsername] = useState("");
  const [peerId, setPeerId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    refreshGames();
  }, []);

  function beginSingleplayer() {
    Chess().init(activeMods, "white");
    navigate("/match");
  }

  function hostMultiplayer() {
    Chess().init(activeMods, "white");
    props.setMultiplayer(true);
    Multiplayer().hostGame(username, activeMods);
    navigate("/match");
  }

  function joinMultiplayer() {
    Multiplayer().startGame = handleGameJoined;
    Multiplayer().joinGame(peerId);
  }

  function refreshGames() {
    fetch("https://chess2-backend-f7a44cf758b2.herokuapp.com/games", { mode: "cors" })
      .then((res) => res.json())
      .then((result) => {
        setOpenGames(result);
      });
  }

  function handleModsChanged(mods) {
    setActiveMods(mods);
  }

  function handleUsernameChanged(event) {
    setUsername(event.target.value);
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
      <br />
      <input name="username" defaultValue="" onChange={handleUsernameChanged} placeholder="Enter a username to display to opponents" />
      <button onClick={hostMultiplayer}>Host Game</button>
      <br />
      <span>
        <select value={peerId} onChange={(e) => setPeerId(e.target.value)}>
          <option value="">Select a user to join</option>
          {openGames.map((game) => (
            <option key={game.id} value={game.peerid}>
              {game.username}
            </option>
          ))}
        </select>
        <button onClick={refreshGames}>Refresh</button>
      </span>
      <button onClick={joinMultiplayer}>Join Game</button>
      <br />
      <p>Select all mods you want to use.</p>
      <div id="mod-selector">
        <ModManager handleModsChanged={handleModsChanged} />
      </div>
      <br />
    </div>
  );
};

export default MainMenu;
