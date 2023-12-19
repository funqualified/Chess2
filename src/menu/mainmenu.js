import Title from "./title";
import ModMenu from "./modMenu";
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
    props.setMultiplayer(false);
    Chess().init(activeMods, "white");
    navigate("/match");
  }

  function hostMultiplayer() {
    Chess().init(activeMods, "white");
    props.setMultiplayer(true);
    Multiplayer().hostGame(username, activeMods, isPrivate);
    navigate("/match");
  }

  async function joinMultiplayer() {
    if (peerId === "") {
      var peerIdFromGameId = await Multiplayer().getPeerIdfromGameId(gameId);
      if (!peerIdFromGameId || peerIdFromGameId === "") {
        alert("Invalid game id");
        return;
      }
      Multiplayer().startGame = handleGameJoined;
      Multiplayer().joinGame(peerIdFromGameId);
    } else {
      Multiplayer().startGame = handleGameJoined;
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
    //Filter out non-alphanumeric characters
    event.target.value = event.target.value.replace(/[^a-zA-Z0-9]/g, "");
    //replace 1 with I
    event.target.value = event.target.value.replace(/1/g, "I");
    //replace 0 with O
    event.target.value = event.target.value.replace(/0/g, "O");
    //Convert to uppercase
    event.target.value = event.target.value.toUpperCase();

    setgameId(event.target.value);
  }

  function handleIsPrivateChange(event) {
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
          <button className="button-53" onClick={() => setScreen("multiplayer")}>
            Multiplayer (Online)
          </button>
          <button className="button-53" onClick={() => setScreen("singleplayer")}>
            VS CPU (random)
          </button>
        </div>
      )}
      {screen === "multiplayer" && (
        <div className="menu">
          <button className="button-53" onClick={() => setScreen("createGame")}>
            Create Game
          </button>
          <button className="button-53" onClick={() => setScreen("joinGame")}>
            Join Game
          </button>
          <button className="button-53" onClick={() => setScreen("mainmenu")}>
            Back
          </button>
        </div>
      )}
      {screen === "singleplayer" && (
        <div className="menu">
          <p>Select all mods you want to use.</p>
          <ModMenu handleModsChanged={handleModsChanged} />
          <button className="button-53" onClick={beginSingleplayer}>
            Play
          </button>
          <button className="button-53" onClick={() => setScreen("mainmenu")}>
            Back
          </button>
        </div>
      )}
      {screen === "createGame" && (
        <div className="menu">
          <input className="menuInput" name="username" defaultValue="" onChange={handleUsernameChanged} placeholder="Username" />
          <br />
          <span>
            <input onChange={handleIsPrivateChange} type="checkbox" name="isPrivate" value={isPrivate} /> <label> Private Game?</label>
          </span>
          <p>Select all mods you want to use.</p>
          <ModMenu handleModsChanged={handleModsChanged} />
          <button className="button-53" onClick={hostMultiplayer}>
            Host Game
          </button>
          <button className="button-53" onClick={() => setScreen("multiplayer")}>
            Back
          </button>
        </div>
      )}
      {screen === "joinGame" && (
        <div className="menu">
          <button className="button-53" onClick={() => setScreen("joinPrivateGame")}>
            Join Private Game
          </button>
          <button className="button-53" onClick={() => setScreen("joinPublicGame")}>
            Join Public Game
          </button>
          <button className="button-53" onClick={() => setScreen("multiplayer")}>
            Back
          </button>
        </div>
      )}
      {screen === "joinPrivateGame" && (
        <div className="menu">
          <input className="menuInput" name="username" defaultValue="" onChange={handleUsernameChanged} placeholder="Username" />
          <br />
          <input className="menuInput" name="gameId" defaultValue="" maxLength={6} onChange={handleGameIdChanged} placeholder="Enter the game id" />
          <br />
          <button className="button-53" onClick={joinMultiplayer} disabled={gameId.length !== 6}>
            Join Game
          </button>
          <button className="button-53" onClick={() => setScreen("multiplayer")}>
            Back
          </button>
        </div>
      )}
      {screen === "joinPublicGame" && (
        <div className="menu">
          <select className="menuInput" value={peerId} onChange={(e) => setPeerId(e.target.value)}>
            <option value="">Select a user to join</option>
            {openGames.map((game) => (
              <option key={game.id} value={game.peerid}>
                {game.username}
              </option>
            ))}
          </select>
          <button className="button-53" onClick={refreshGames}>
            Refresh
          </button>
          <br />
          <button className="button-53" onClick={joinMultiplayer} disabled={peerId === ""}>
            Join Game
          </button>
          <button
            className="button-53"
            onClick={() => {
              setScreen("multiplayer");
              setPeerId("");
            }}>
            Back
          </button>
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
        <ModMenu handleModsChanged={handleModsChanged} />
      </div>
      <br />
    </div> */}
    </div>
  );
};

export default MainMenu;
