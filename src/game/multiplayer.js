import Peer from "peerjs";
import GridPosition from "../models/gridPosition";
import Chess from "./chess2";
import { Piece, clonePiece } from "./piece";

class Multiplayer {
  constructor() {
    this.peer = null;
    this.peerIsConnected = false;
    this.conn = null;
    this.updateUI = () => {};
    this.startGame = () => {};
    this.gameid = "";
    this.isPrivate = false;
    this.refresh = null;
  }

  hostGame(username, mods, isPrivate) {
    getMultiplayer().peer = new Peer();
    getMultiplayer().isPrivate = isPrivate;
    getMultiplayer().peer.on("open", function (id) {
      fetch("http://central-funqualified-server-9a93df127526.herokuapp.com/api/chess?action=newGame", {
        mode: "cors",
        method: "POST",
        body: JSON.stringify({ peerid: id, username: username, mods: mods, isPrivate: isPrivate }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((result) => {
          getMultiplayer().gameid = result.id;
          getMultiplayer().refresh = setInterval(getMultiplayer().keepListingAlive, 1000 * 15);
        });
    });

    getMultiplayer().peer.on("connection", function (dataConnection) {
      if (getMultiplayer().peerIsConnected) {
        dataConnection.close();
      }
      getMultiplayer().peerIsConnected = true;
      getMultiplayer().conn = dataConnection;

      dataConnection.on("open", function () {
        getMultiplayer().closeListing();
        console.log("connection");
        getMultiplayer().updateUI();
        dataConnection.send({
          mods: Chess().mods,
          board: JSON.stringify(Chess().board),
          turn: Chess().turn,
          enPassant: JSON.stringify(Chess().enPassant),
        });
      });

      dataConnection.on("data", getMultiplayer().handleData);

      dataConnection.on("error", function (err) {
        console.log(err);
      });

      dataConnection.on("close", function () {
        console.log("disconnection");
        getMultiplayer().peerIsConnected = false;
        getMultiplayer().updateUI();
      });
    });
  }

  joinGame(peerId) {
    getMultiplayer().peer = new Peer();
    getMultiplayer().peer.on("open", function (id) {
      getMultiplayer().conn = getMultiplayer().peer.connect(peerId);

      getMultiplayer().conn.on("open", function () {
        console.log("connection");
        getMultiplayer().updateUI();
        getMultiplayer().peerIsConnected = true;
      });

      getMultiplayer().conn.on("data", getMultiplayer().handleData);

      getMultiplayer().conn.on("error", function (err) {
        console.log(err);
      });
    });
  }

  async getPeerIdfromGameId(gameId) {
    const id = await fetch(`http://central-funqualified-server-9a93df127526.herokuapp.com/api/chess?action=getGame&gameId=${gameId}`, {
      mode: "cors",
      method: "GET",
    }).then((res) => res.json());
    return id;
  }
  closeListing = () => {
    clearInterval(getMultiplayer().refresh);
    fetch(`http://central-funqualified-server-9a93df127526.herokuapp.com/api/chess?action=deleteGame&id=${getMultiplayer().gameid}`, {
      mode: "cors",
      method: "DELETE",
    });
  };

  keepListingAlive = () => {
    console.log(getMultiplayer());
    fetch(`http://central-funqualified-server-9a93df127526.herokuapp.com/api/chess?action=keepGameAlive&id=${getMultiplayer().gameid}`, {
      mode: "cors",
      method: "POST",
    });
  };

  disconnect = () => {
    getMultiplayer().peer.destroy();
  };

  handleData = function (data) {
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
      Chess().enPassant = new GridPosition(data.enPassant.row, data.enPassant.col);
    }

    if (data.hasOwnProperty("board")) {
      const board = JSON.parse(data.board);
      Chess().board = board.map(function (innerArr) {
        return innerArr.map(function (p) {
          if (!p) {
            return null;
          }
          return clonePiece(p);
        });
      });
    }
    getMultiplayer().updateUI();
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
