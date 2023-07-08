import Peer from "peerjs";
import Chess, { Piece } from "./chess2";

class Multiplayer {
  constructor() {
    this.peer = null;
    this.peerIsConnected = false;
    this.conn = null;
    this.updateUI = () => {};
    this.startGame = () => {};
  }

  hostGame() {
    getMultiplayer().peer = new Peer();
    getMultiplayer().peer.on("open", function (id) {
      console.log("My peer ID is: " + id);
      window.alert("My peer ID is: " + id);
    });

    getMultiplayer().peer.on("connection", function (dataConnection) {
      if (getMultiplayer().peerIsConnected) {
        dataConnection.close();
      }
      getMultiplayer().peerIsConnected = true;
      getMultiplayer().conn = dataConnection;

      dataConnection.on("open", function () {
        dataConnection.send({
          mods: Chess().mods,
          board: Chess().board,
          turn: Chess().turn,
        });
      });

      dataConnection.on("data", getMultiplayer().handleData);

      dataConnection.on("error", function (err) {
        console.log(err);
      });

      dataConnection.on("disconnected", function () {
        getMultiplayer().peerIsConnected = false;
      });
    });
  }

  joinGame(peerId) {
    getMultiplayer().peer = new Peer();
    getMultiplayer().peer.on("open", function (id) {
      console.log("My peer ID is: " + id);
      getMultiplayer().conn = getMultiplayer().peer.connect(peerId);

      getMultiplayer().conn.on("open", function () {
        getMultiplayer().peerIsConnected = true;
      });

      this.conn.on("data", getMultiplayer().handleData);

      this.conn.on("error", function (err) {
        console.log(err);
      });
    });
  }

  handleData = function (data) {
    if (data.hasOwnProperty("mods")) {
      getMultiplayer().startGame(data.mods, true, "black");
    }

    if (data.hasOwnProperty("turn")) {
      Chess().turn = data.turn;
    }

    if (data.hasOwnProperty("winner")) {
      Chess().winner = data.winner;
    }

    if (data.hasOwnProperty("board")) {
      Chess().board = data.board.map(function (innerArr) {
        return innerArr.map(function (p) {
          if (!p) {
            return null;
          }
          return new Piece(p.color, p.fenId, p.name, p.moveTypes, p.hasShield, p.canPromote, p.loyalty);
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
