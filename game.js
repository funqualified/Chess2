var board = null;
var game = null;

function startGame(mods = [], multiplayer = false) {
  document.getElementById("game-space").innerHTML =
    "<div id='myBoard' class='board'></div><div class='info-container'><div id='space-details' class='info-box'></div><div id='game-details' class='info-box'></div></div>";
  document.getElementById("menu-space").classList.add("hide");
  game = new Chess("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  mods.forEach((element) => {
    game.mods.push(element);
  });
  //game.mods.push(GameTags.WRAP);
  //game.mods.push(GameTags.VAMPIRE);
  // game.mods.push(GameTags.BOMBERS);
  //game.mods.push(GameTags.FOG);
  // game.mods.push(GameTags.HITCHANCE);
  // game.mods.push(GameTags.RELOAD);
  //game.mods.push(GameTags.SHIELDS);
  // game.mods.push(GameTags.STAMINA);
  //game.mods.push(GameTags.LOYALTY);
  // game.mods.push(GameTags.VAMPIRE);
  // game.mods.push(GameTags.WRAP);
  // game.mods.push(GameTags.VAMPIRE);
  const info = game.getGameInfo();
  if (info) {
    document.getElementById("game-details").innerHTML = `<p>${info.replaceAll(
      /\n|,/g,
      "<br>"
    )}</p>`;
  }

  var config = {
    draggable: true,
    position: game.fen(),
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

  // only pick up pieces for White
  if (piece.search(/^b/) !== -1) return false;
}

function makeRandomMove() {
  var possibleMoves = game.moves("black");

  // game over
  if (possibleMoves.length === 0) return;

  var randomIdx = Math.floor(Math.random() * possibleMoves.length);
  game.move(possibleMoves[randomIdx].from, possibleMoves[randomIdx].to);
  board.position(game.fen());
}

function onDrop(source, target) {
  removeGreySquares();

  // see if the move is legal
  if (source === "offboard" || target === "offboard") {
    return "snapback";
  }

  var move = game.move(source, target);

  // illegal move
  if (!move) {
    return "snapback";
  }

  // make random legal move for black
  window.setTimeout(makeRandomMove, 250);
}

var whiteSquareGrey = "#a9a9a9";
var blackSquareGrey = "#696969";

function onMouseoverSquare(square, piece) {
  const info = game.getPieceInfo(square);
  if (info) {
    document.getElementById("space-details").innerHTML = `<p>${info.replaceAll(
      /\n|,/g,
      "<br>"
    )}</p>`;
  }

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

function onMouseoutSquare(square, piece) {
  removeGreySquares();
  document.getElementById("space-details").innerHTML = "";
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
