var board = null;
var game = null;
var multiplayer = false;

function startGame(mods = [], isMultiplayer = false, color = "white") {
  document.getElementById("game-space").classList.remove("hide");
  document.getElementById("menu-space").classList.add("hide");
  game = new Chess(mods, color);
  multiplayer = isMultiplayer;
  const info = game.getGameInfo();
  if (info) {
    document.getElementById("game-details").innerHTML = `<p>${info.replaceAll(/\n/g, "<br>")}</p>`;
  }

  var config = {
    draggable: true,
    position: game.fen(),
    orientation: color,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
  };
  board = Chessboard("myBoard", config);
  $(window).resize(board.resize);
}

function onDragStart(source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false;
  if (game.turn != game.playerColor.charAt(0)) return false;

  // only pick up pieces for White
  if (game.playerColor == "white") {
    if (piece.search(/^b/) !== -1) return false;
  } else {
    if (piece.search(/^w/) !== -1) return false;
  }
}

async function makeRandomMove() {
  var possibleMoves = game.moves("black");

  // game over
  if (possibleMoves.length === 0) return;

  var randomIdx = Math.floor(Math.random() * possibleMoves.length);
  await game.move(possibleMoves[randomIdx].from, possibleMoves[randomIdx].to);
  board.position(game.fen());
  const info = game.getGameInfo();
  if (info) {
    document.getElementById("game-details").innerHTML = `<p>${info.replaceAll(/\n/g, "<br>")}</p>`;
  }
}

async function onDrop(source, target) {
  removeGreySquares();

  // see if the move is legal
  if (source === "offboard" || target === "offboard") {
    return "snapback";
  }

  var move = await game.move(source, target);
  board.position(game.fen());

  // illegal move
  if (!move) {
    return "snapback";
  } else if (multiplayer && peerIsConnected) {
    conn.send({ board: game.board, turn: game.turn, winner: game.winner });
  }

  // make random legal move for black
  if (!multiplayer && !game.game_over()) {
    window.setTimeout(makeRandomMove, 250);
  }
  const info = game.getGameInfo();
  if (info) {
    document.getElementById("game-details").innerHTML = `<p>${info.replaceAll(/\n/g, "<br>")}</p>`;
  }
}

var whiteSquareGrey = "#a9a9a9";
var blackSquareGrey = "#696969";

function onMouseoverSquare(square, piece) {
  const info = game.getPieceInfo(square);
  if (info) {
    document.getElementById("space-details").innerHTML = `<p>${info.replaceAll(/\n/g, "<br>")}</p>`;
  }

  greySquareMoves(square);
}

function onMouseoutSquare(square, piece) {
  removeGreySquares();
  document.getElementById("space-details").innerHTML = "";
}

function greySquareMoves(square) {
  // get list of possible moves for this square
  var moves = game.moves(square, true);

  // exit if there are no moves available for this square
  if (moves.length === 0) return;

  // highlight the square they moused over
  greySquare(square);

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to);
  }
}

function removeGreySquares() {
  $("#myBoard .square-55d63").css("background", "");
}

function greySquare(square) {
  var $square = $("#myBoard .square-" + square);

  var background = whiteSquareGrey;
  if ($square.hasClass("black-3c85d")) {
    background = blackSquareGrey;
  }

  $square.css("background", background);
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd() {
  board.position(game.fen());
}
