import Multiplayer from "../game/multiplayer";

const ConnectionIndicator = (props) => {
  return (
    <div style={{ position: "absolute", display: "flex", flexDirection: "row" }}>
      <div style={{ backgroundColor: Multiplayer().peerIsConnected ? "green" : "red", borderRadius: "50%", width: "3vh", height: "3vh", margin: "1vh" }}></div>
      <p>{Multiplayer().peerIsConnected} : {Multiplayer().gameid.toUpperCase()}</p>
    </div>
  );
};

export default ConnectionIndicator;
