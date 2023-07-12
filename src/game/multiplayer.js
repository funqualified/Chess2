import Peer from "peerjs";
import Chess, { Piece } from "./chess2";

class Multiplayer {
  constructor() {
    this.peer = null;
    this.peerIsConnected = false;
    this.conn = null;
    this.updateUI = () => {};
    this.startGame = () => {};
    this.gameid = "";
    this.refresh = null;
  }

  hostGame(username, mods) {
    console.log("host1");
    getMultiplayer().peer = new Peer();
    console.log("host2");
    getMultiplayer().peer.on("open", function (id) {
      fetch("https://chess2-backend-f7a44cf758b2.herokuapp.com/newGame", {
        mode: "cors",
        method: "POST",
        body: JSON.stringify({ peerid: id, username: username, mods: mods }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((result) => {
          getMultiplayer().gameid = result.id;
          getMultiplayer().refresh = setInterval(getMultiplayer().keepListingAlive, 1000 * 60);
          console.log("host3");
        });
    });

    getMultiplayer().peer.on("connection", function (dataConnection) {
      if (getMultiplayer().peerIsConnected) {
        dataConnection.close();
      }
      getMultiplayer().peerIsConnected = true;
      getMultiplayer().conn = dataConnection;
      console.log("host4");

      dataConnection.on("open", function () {
        getMultiplayer().closeListing();
        console.log("connection");
        dataConnection.send({
          mods: Chess().mods,
          board: Chess().board,
          turn: Chess().turn,
          enPassant: Chess().enPassant,
        });
      });

      dataConnection.on("data", getMultiplayer().handleData);

      dataConnection.on("error", function (err) {
        console.log(err);
      });

      dataConnection.on("disconnected", function () {
        console.log("disconnection");
        getMultiplayer().peerIsConnected = false;
      });
    });
  }

  joinGame(peerId) {
    console.log("join1");
    getMultiplayer().peer = new Peer();
    console.log("join2");
    getMultiplayer().peer.on("open", function (id) {
      console.log("join3");
      getMultiplayer().conn = getMultiplayer().peer.connect(peerId);

      getMultiplayer().conn.on("open", function () {
        console.log("connection");
        getMultiplayer().peerIsConnected = true;
      });

      getMultiplayer().conn.on("data", getMultiplayer().handleData);

      getMultiplayer().conn.on("error", function (err) {
        console.log(err);
      });
    });
  }

  closeListing = () => {
    clearInterval(getMultiplayer().refresh);
    fetch(`https://chess2-backend-f7a44cf758b2.herokuapp.com/closeGame/${getMultiplayer().gameid}`, {
      mode: "cors",
      method: "DELETE",
    });
  };

  keepListingAlive = () => {
    fetch(`https://chess2-backend-f7a44cf758b2.herokuapp.com/keepGameAlive/${getMultiplayer().gameid}`, {
      mode: "cors",
      method: "POST",
    });
  };

  handleData = function (data) {
    console.log(data);
    if (data.hasOwnProperty("mods")) {
      getMultiplayer().startGame(data.mods, "black");
    }

    if (data.hasOwnProperty("turn")) {
      Chess().turn = data.turn;
    }

    if (data.hasOwnProperty("winner")) {
      Chess().winner = data.winner;
    }

    if (data.hasOwnProperty("enPassant")) {
      Chess().enPassant = data.enPassant;
    }

    if (data.hasOwnProperty("board")) {
      Chess().board = data.board.map(function (innerArr) {
        return innerArr.map(function (p) {
          if (!p) {
            return null;
          }
          return new Piece(p.color, p.fenId, p.startingIndex, p.name, p.moveTypes, p.hasShield, p.canPromote, p.loyalty);
        });
      });

      getMultiplayer().updateUI();
    }
  };
}

let instance = null;

function getMultiplayer() {
  if (!instance) {
    instance = new Multiplayer();
  }
  return instance;
}

export default getMultiplayer;
