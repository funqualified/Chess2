let peer = null;
let peerIsConnected = false;
let conn = null;

function hostGame() {
  peer = new Peer();
  peer.on("open", function (id) {
    console.log("My peer ID is: " + id);
    window.alert("My peer ID is: " + id);
    navigator.clipboard.writeText(id);
    startGame(mods, true);
  });

  peer.on("connection", function (dataConnection) {
    if (peerIsConnected) {
      dataConnection.close();
    }
    peerIsConnected = true;
    conn = dataConnection;

    dataConnection.on("open", function () {
      console.log("connection");
      dataConnection.send({
        mods: game.mods,
        board: game.board,
        turn: game.turn,
      });
    });

    dataConnection.on("data", handeData);

    dataConnection.on("error", function (err) {
      console.log(err);
    });

    dataConnection.on("disconnected", function () {
      console.log("disconnection");
      peerIsConnected = false;
    });
  });
}

function joinGame(peerId) {
  peer = new Peer();
  peer.on("open", function (id) {
    console.log("My peer ID is: " + id);
    conn = peer.connect($('input[name="PeerId"]').val());

    conn.on("open", function () {
      console.log("connection");
      peerIsConnected = true;
    });

    conn.on("data", handeData);

    conn.on("error", function (err) {
      console.log(err);
    });
  });
}

handeData = function (data) {
  if (data.hasOwnProperty("mods")) {
    startGame(data.mods, true, "black");
  }

  if (data.hasOwnProperty("turn")) {
    game.turn = data.turn;
  }

  if (data.hasOwnProperty("winner")) {
    game.winner = data.winner;
  }

  if (data.hasOwnProperty("board")) {
    game.board = data.board.map(function (innerArr) {
      return innerArr.map(function (p) {
        if (!p) {
          return null;
        }
        return new Piece(p.color, p.fenId, p.name, p.moveTypes, p.hasShield, p.loyalty);
      });
    });
    board.position(game.fen());
    const info = game.getGameInfo();
    if (info) {
      document.getElementById("game-details").innerHTML = `<p>${info.replaceAll(/\n|,/g, "<br>")}</p>`;
    }
  }
};
