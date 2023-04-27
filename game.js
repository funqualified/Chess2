var board = null;
var game = new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
game.mods.push(GameTags.FOG);

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for White
  if (piece.search(/^b/) !== -1) return false
}

function makeRandomMove () {
  var possibleMoves = game.moves("black");

  // game over
  if (possibleMoves.length === 0) return

  var randomIdx = Math.floor(Math.random() * possibleMoves.length)
  game.move(possibleMoves[randomIdx].from, possibleMoves[randomIdx].to)
  board.position(game.fen())
}

function onDrop (source, target) {
  // see if the move is legal
    if(source === 'offboard' || target === 'offboard'){
        return 'snapback';
    }

  var move = game.move(source, target);

  // illegal move
  if(!move){return 'snapback'}

  // make random legal move for black
  window.setTimeout(makeRandomMove, 250)
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen());
}


var config = {
  draggable: true,
  position: game.fen(),
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
}
board = Chessboard('myBoard', config);
$(window).resize(board.resize)