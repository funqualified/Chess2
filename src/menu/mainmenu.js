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
  const [gameId, setgameId] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [screen, setScreen] = useState("mainmenu"); // ["mainmenu", "multiplayer", "singleplayer", "createGame", "joinGame"]
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
    Multiplayer().hostGame(username, activeMods, isPrivate);
    navigate("/match");
  }

  function joinMultiplayer() {
    Multiplayer().startGame = handleGameJoined;
    if(peerId === "") {
      Multiplayer().joinGame(gameId);
    } else {
      Multiplayer().joinGame(peerId);
    } 
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

  function handleGameIdChanged(event) {
    //Filter out non-alphabetical characters
    event.target.value = event.target.value.replace(/[^a-zA-Z]/g, "");
    //Convert to uppercase
    event.target.value = event.target.value.toUpperCase();
    
    setgameId(event.target.value);
  }

  function handlsIsPrivateChange(event) {
    setIsPrivate(event.target.checked);
  }

  function handleGameJoined(mods, color) {
    Chess().init(mods, color);
    props.setMultiplayer(true);
    navigate("/match");
  }

  return (
    <div id="menu-space" className="menu">
      <Title />
      {screen === "mainmenu" && (
        <div className="menu">
          <button onClick={() => setScreen("multiplayer")}>Multiplayer(Online)</button>
          <button onClick={() => setScreen("singleplayer")}>VS CPU(random)</button>
        </div>
      )}
      {screen === "multiplayer" && (
        <div className="menu">
          <button onClick={() => setScreen("createGame")}>Create Game</button>
          <button onClick={() => setScreen("joinGame")}>Join Game</button>
          <button onClick={() => setScreen("mainmenu")}>Back</button>

        </div>
      )}
      {screen === "singleplayer" && (
        <div  className="menu">
          <p>Select all mods you want to use.</p>
          <div id="mod-selector">
            <ModManager handleModsChanged={handleModsChanged} />
          </div>
          <button onClick={beginSingleplayer}>Play</button>
          <button onClick={() => setScreen("mainmenu")}>Back</button>
        </div>
      )}
      {screen === "createGame" && (
        <div className="menu">
          <input name="username" defaultValue="" onChange={handleUsernameChanged} placeholder="Enter a username to display to opponents" />
          <br />
          <span>
            <input onChange={handlsIsPrivateChange} type="checkbox" name="isPrivate" value={isPrivate} /> <label> Private Game?</label>
          </span>
          <p>Select all mods you want to use.</p>
          <div id="mod-selector">
            <ModManager handleModsChanged={handleModsChanged} />
          </div>
          <button onClick={hostMultiplayer}>Host Game</button>
          <button onClick={() => setScreen("multiplayer")}>Back</button>
        </div>
      )}
      {screen === "joinGame" && (
        <div className="menu">
          <button onClick={() => setScreen("joinPrivateGame")}>Join Private Game</button>
          <button onClick={() => setScreen("joinPublicGame")}>Join Public Game</button>
          <button onClick={() => setScreen("multiplayer")}>Back</button>
        </div>
      )}
      {screen === "joinPrivateGame" && (
        <div className="menu">
          <input name="username" defaultValue="" onChange={handleUsernameChanged} placeholder="Enter a username to display to opponents" />
          <br />
          <input name="gameId" defaultValue="" maxLength={6} onChange={handleGameIdChanged} placeholder="Enter the game id" />
          <br />
          <button onClick={joinMultiplayer} disabled={gameId.length !== 6}>Join Game</button>
          <button onClick={() => setScreen("multiplayer")}>Back</button>
        </div>
      )}
      {screen === "joinPublicGame" && (
        <div className="menu">
          <select value={peerId} onChange={(e) => setPeerId(e.target.value)}>
            <option value="">Select a user to join</option>
            {openGames.map((game) => (
              <option key={game.id} value={game.peerid}>
                {game.username}
              </option>
            ))}
          </select>
          <button onClick={refreshGames}>Refresh</button>
          <br />
          <button onClick={joinMultiplayer} disabled={peerId === ""}>Join Game</button>
          <button onClick={() => {setScreen("multiplayer"); setPeerId("")}}>Back</button>
        </div>
      )}
      
      {/* <button onClick={beginSingleplayer}>Single Player</button>
      <br />
      <input name="username" defaultValue="" onChange={handleUsernameChanged} placeholder="Enter a username to display to opponents" />
      <span>
      <input onChange={handlsIsPrivateChange} type="checkbox" name="isPrivate" value={isPrivate} /> <label> Private Game?</label>
      </span>
      <button onClick={hostMultiplayer}>Host Game</button>
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
    </div> */}

    </div>
  );
};

export default MainMenu;
