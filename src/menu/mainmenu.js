import Title from "./title";
import ModMenu from "./modMenu";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Chess from "../game/chess2";
import Multiplayer from "../game/multiplayer";
import VersionFooter from "../versionFooter";
import useSound from "use-sound";

import clickSfx from "../assets/Audio/PressButton.wav";
import menuMusic from "../assets/Audio/MenuMusic.mp3";

import Button from "@mui/joy/Button";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";

const MainMenu = (props) => {
  const [activeMods, setActiveMods] = useState([]);
  const [openGames, setOpenGames] = useState([]);
  const [username, setUsername] = useState("");
  const [peerId, setPeerId] = useState("");
  const [gameId, setgameId] = useState("");
  const [gameInfo, setGameInfo] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [screen, setScreen] = useState("mainmenu"); // ["mainmenu", "multiplayer", "singleplayer", "createGame", "joinGame"]
  const [playClick] = useSound(clickSfx, { volume: 0.25 });
  const [playMenuMusic, musicObj] = useSound(menuMusic, { volume: 0.02, loop: true, autoplay: true });
  const navigate = useNavigate();

  useEffect(() => {
    refreshGames();
  }, []);

  function beginSingleplayer() {
    props.setMultiplayer(false);
    Chess().init(activeMods, "white");
    musicObj.stop();
    navigate("/match");
  }

  function hostMultiplayer() {
    Chess().init(activeMods, "white");
    props.setMultiplayer(true);
    Multiplayer().hostGame(username, activeMods, isPrivate);
    musicObj.stop();
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
      <Button id="menu-info-toggle" onClick={() => setGameInfo(!gameInfo)}>
        i
      </Button>
      {gameInfo && (
        <Modal open={gameInfo} onClose={() => setGameInfo(false)}>
          <div id="menu-info-box">
            <ModalClose onClick={() => setGameInfo(false)}>X</ModalClose>
            <p> Chess 2 - Game of the Year Edition</p>
            <p>
              {" "}
              What is it?
              <br /> Chess, but better. Inpired by a number of things, ultimately Chess 2 is an attempt to add robust mod support to the centuries old game of
              Chess.
            </p>
            <p>
              {" "}
              Did you say mods?
              <br /> I sure did. For now, you can play with a number of built in modification to the base rules of Chess. But as we approach a full release, the
              game will open up to community mod support. I hope for Chess 2 to be the top way to play established chess variant, new rules additions, and wacky
              absurdity.
            </p>
            <p>
              {" "}
              How do I play?
              <br /> Pick singleplayer or multiplayer, add some mods, and start playing. Unless a mod changes something, all the standard rules of chess are in
              play. In multiplayer you can create private matches and send the session code to a friend. You can also start or join a public game to play with a
              stranger.
            </p>
            <p>
              {" "}
              When will the full game be ready?
              <br /> Probably late 2024.
            </p>
            <p>
              {" "}
              Wait. Does that say "Game of the Year Edition"? Who gave you that title?
              <br /> I did. It's my game of the year.
            </p>
            <p>
              {" "}
              Who is making this?
              <br /> Me. Ryan Lindemuder. Just a cool guy making games.{" "}
            </p>
          </div>
        </Modal>
      )}
      <Title />
      {screen === "mainmenu" && (
        <div className="menu">
          <Button className="button-53" onClick={() => setScreen("multiplayer")} onMouseDown={playClick}>
            Multiplayer
            <br />
            (Online)
          </Button>
          <Button className="button-53" onClick={() => setScreen("singleplayer")} onMouseDown={playClick}>
            VS CPU
            <br />
            (very dumb AI)
          </Button>
        </div>
      )}
      {screen === "multiplayer" && (
        <div className="menu">
          <Button className="button-53" onClick={() => setScreen("createGame")} onMouseDown={playClick}>
            Create Game
          </Button>
          <Button className="button-53" onClick={() => setScreen("joinGame")} onMouseDown={playClick}>
            Join Game
          </Button>
          <Button className="button-53" onClick={() => setScreen("mainmenu")} onMouseDown={playClick}>
            Back
          </Button>
        </div>
      )}
      {screen === "singleplayer" && (
        <div className="menu">
          <p>Select all mods you want to use.</p>
          <ModMenu handleModsChanged={handleModsChanged} />
          <Button className="button-53" onClick={beginSingleplayer} onMouseDown={playClick}>
            Play
          </Button>
          <Button className="button-53" onClick={() => setScreen("mainmenu")} onMouseDown={playClick}>
            Back
          </Button>
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
          <Button className="button-53" onClick={hostMultiplayer} onMouseDown={playClick}>
            Host Game
          </Button>
          <Button className="button-53" onClick={() => setScreen("multiplayer")} onMouseDown={playClick}>
            Back
          </Button>
        </div>
      )}
      {screen === "joinGame" && (
        <div className="menu">
          <Button className="button-53" onClick={() => setScreen("joinPrivateGame")} onMouseDown={playClick}>
            Join Private Game
          </Button>
          <Button className="button-53" onClick={() => setScreen("joinPublicGame")} onMouseDown={playClick}>
            Join Public Game
          </Button>
          <Button className="button-53" onClick={() => setScreen("multiplayer")} onMouseDown={playClick}>
            Back
          </Button>
        </div>
      )}
      {screen === "joinPrivateGame" && (
        <div className="menu">
          <input className="menuInput" name="username" defaultValue="" onChange={handleUsernameChanged} placeholder="Username" />
          <br />
          <input className="menuInput" name="gameId" defaultValue="" maxLength={6} onChange={handleGameIdChanged} placeholder="Enter the game id" />
          <br />
          <Button className="button-53" onClick={joinMultiplayer} disabled={gameId.length !== 6} onMouseDown={playClick}>
            Join Game
          </Button>
          <Button className="button-53" onClick={() => setScreen("multiplayer")} onMouseDown={playClick}>
            Back
          </Button>
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
          <Button className="button-53" onClick={refreshGames} onMouseDown={playClick}>
            Refresh
          </Button>
          <br />
          <Button className="button-53" onClick={joinMultiplayer} disabled={peerId === ""} onMouseDown={playClick}>
            Join Game
          </Button>
          <Button
            className="button-53"
            onMouseDown={playClick}
            onClick={() => {
              setScreen("multiplayer");
              setPeerId("");
            }}>
            Back
          </Button>
        </div>
      )}
      <VersionFooter />
    </div>
  );
};

export default MainMenu;
