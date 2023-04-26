var board = null;
var game = new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
var whiteTurn = true;

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for White
  if(whiteTurn){
    if (piece.search(/^b/) !== -1) return false
  }else{
    if (piece.search(/^w/) !== -1) return false
  }
}

function makeRandomMove () {
  //var possibleMoves = game.moves()

  // game over
  //if (possibleMoves.length === 0) return

  //var randomIdx = Math.floor(Math.random() * possibleMoves.length)
  //game.move(possibleMoves[randomIdx])
  //board.position(game.fen())
}

function onDrop (source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
  });

  if(move){whiteTurn = !whiteTurn;}
  else{return 'snapback'}
  // illegal move
  //if (move === null) return 'snapback'

  // make random legal move for black
  //window.setTimeout(makeRandomMove, 250)
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