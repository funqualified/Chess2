import gameplayUIManager from "./gameplayUI";
import GridPosition from "../models/gridPosition";
import Piece, { pieceFactory, clonePiece } from "./piece";
import Board from "./board";

async function gameEventAsync(type, game, data) {
  var action = "continue";
  await game.mods.forEach(async (mod) => {
    if (mod.events[type]) {
      action = await mod.events[type](game, data);
    }
    if (action === "noDefault" || action === "noMods" || action === "noDefaultNoMods") {
      return;
    }
  });
  return action === "continue" || action === "noMods";
}

function gameEvent(type, game, data) {
  var action = "continue";
  game.mods.forEach((mod) => {
    if (mod.events[type]) {
      action = mod.events[type](game, data);
    }
    if (action === "noDefault" || action === "noMods" || action === "noDefaultNoMods") {
      return;
    }
  });
  return action === "continue" || action === "noMods";
}

class Chess {
  constructor() {
    this.initialized = false;
  }

  undo() {
    if (this.history.length > 0) {
      const move = this.history.pop();
      this.board = move.board.map(function (innerArr) {
        return innerArr.map(function (p) {
          if (!p) {
            return null;
          }
          return clonePiece(p);
        });
      });
      this.turn = move.turn;
      this.castling = move.castling;
      this.enPassant = new GridPosition(move.enPassant.row, move.enPassant.col);
      this.winner = null;
      return true;
    }
    return false;
  }

  copy() {
    const copy = new Chess();
    copy.board = this.board.getCopy();
    copy.turn = this.turn;
    copy.castling = this.castling;
    copy.enPassant = this.enPassant;
    copy.winner = this.winner;
    copy.initialized = this.initialized;
    copy.history = this.history;
    copy.mods = this.mods;
    copy.playerColor = this.playerColor;
    copy.isCopy = true;
    return copy;
  }

  init(mods, color = "white") {
    this.board = [];
    this.history = [];
    this.mods = mods;
    var fen = this.getInitialFen();
    const rows = fen.split(" ")[0].split("/");
    this.turn = fen.split(" ")[1];
    this.castling = fen.split(" ")[2];
    this.enPassant = new GridPosition(-1, -1);
    this.playerColor = color;
    this.winner = null;
    this.initialized = true;
    this.isCopy = false;

    this.board = new Board(fen, this);
    this.moves = this.getMoves();
  }

  getInitialFen() {
    var data = {
      fen: "",
    };
    const defaultAction = gameEvent("BoardSetup", this, data);
    if (defaultAction) {
      data.fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    }

    return data.fen;
  }

  getPieceInfo(square) {
    const piece = this.board.getSpace(square.row, square.col).getPiece();
    if (piece) {
      let sight = this.getPlayerSight(this.playerColor);
      if (square.isIn(sight) || piece.color === this.playerColor) {
        return piece.info(this);
      }
      return null;
    }
    return null;
  }

  getGameInfo() {
    if (this.winner === null) {
      return `Current turn: ${this.turn === "w" ? "white" : "black"}\nMods\n${this.mods.map((mod) => mod.description).join("\n")}`;
    } else {
      return `The winner is ${this.winner}`;
    }
  }

  getGameWinner() {
    var data = {
      winner: null,
    };
    const defaultAction = gameEvent("CheckForWinner", this, data);

    if (!defaultAction) {
      return data.winner;
    }

    var winner = null;
    var hasValidMove = false;
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        const piece = this.board.getSpace(i, j).getPiece();
        if (piece !== null && piece.color.charAt(0) === this.turn) {
          this.movesByFrom(new GridPosition(i, j)).forEach((move) => {
            var target = this.board.getSpace(move.to.row, move.to.col).getPiece();
            hasValidMove = true;
            if (target !== null && target.color !== piece.color && target.fenId.toLowerCase() === "k") {
              winner = piece.color;
            }
          });
        }
      }
    }

    if (!hasValidMove) {
      return this.turn === "w" ? "black" : "white";
    }

    return winner;
  }

  getMoves() {
    let moves = [];

    for (let i = 0; i < this.board.height; i++) {
      for (let j = 0; j < this.board.width; j++) {
        const piece = this.board.getSpace(i, j).getPiece();
        if (!!piece) {
          piece.cacheLegalMoves(this);
          moves.push.apply(piece.legalMoves);
        }
      }
    }

    return moves;
  }

  movesByColor(color) {
    return this.moves.filter((move) => this.board.getSpace(move.from.row, move.from.col).color === color);
  }

  movesByFrom(from) {
    return this.moves.filter((move) => move.from.equals(from));
  }

  AIMoves(color) {
    let moves = this.movesByColor(color);

    //Sort moves by best to worst
    moves.sort((a, b) => {
      const pieceA = this.board.getSpace(a.from.row, a.from.col).getPiece();
      const pieceB = this.board.getSpace(b.from.row, b.from.col).getPiece();
      const targetPieceA = this.board.getSpace(a.to.row, a.to.col).getPiece();
      const targetPieceB = this.board.getSpace(b.to.row, b.to.col).getPiece();

      var score = 0;

      //Check if move is a capture
      if (!!targetPieceA && !!targetPieceB) {
        if (targetPieceA.fenId.toLowerCase() === "q") {
          score -= 10;
        }
        if (targetPieceB.fenId.toLowerCase() === "q") {
          score += 10;
        }
        if (targetPieceA.fenId.toLowerCase() === "r") {
          score -= 5;
        }
        if (targetPieceB.fenId.toLowerCase() === "r") {
          score += 5;
        }
        if (targetPieceA.fenId.toLowerCase() === "b") {
          score -= 3;
        }
        if (targetPieceB.fenId.toLowerCase() === "b") {
          score += 3;
        }
        if (targetPieceA.fenId.toLowerCase() === "n") {
          score -= 3;
        }
        if (targetPieceB.fenId.toLowerCase() === "n") {
          score += 3;
        }
        if (targetPieceA.fenId.toLowerCase() === "p") {
          score -= 1;
        }
        if (targetPieceB.fenId.toLowerCase() === "p") {
          score += 1;
        }
      }

      if (!!targetPieceA) {
        score -= 5;
      }
      if (!!targetPieceB) {
        score += 5;
      }

      //Check if move is to a near center square
      const center = new GridPosition(Math.floor(this.board.height / 2), Math.floor(this.board.width / 2));
      const centerA = a.to.distance(center);
      const centerB = b.to.distance(center);
      score += centerA - centerB;

      //Check if move is a pawn move
      if (pieceA.fenId.toLowerCase() === "p") {
        score += 1;
      }
      if (pieceB.fenId.toLowerCase() === "p") {
        score -= 1;
      }

      //Check if move is a queen move
      if (pieceA.fenId.toLowerCase() === "q") {
        score += 2;
      }
      if (pieceB.fenId.toLowerCase() === "q") {
        score -= 2;
      }

      //Check if move is a king move
      if (pieceA.fenId.toLowerCase() === "k") {
        score += 5;
      }
      if (pieceB.fenId.toLowerCase() === "k") {
        score -= 5;
      }

      return score;
    });

    //limit moves to 5
    if (moves.length > 5) {
      moves = moves.slice(0, 5);
    }

    return moves;
  }

  getPlayerSight(color) {
    let sight = [];
    this.movesByColor(color).forEach((move) => {
      sight.push(move.to);
    });
    //Add all pawn forward diagonals to sight
    for (let i = 0; i < this.board.height; i++) {
      for (let j = 0; j < this.board.width; j++) {
        const piece = this.board.getSpace(i, j).getPiece();
        if (!!piece && piece.moveTypes.includes("pawn") && piece.color === this.playerColor) {
          if (piece.color === "white") {
            if (j > 0) {
              sight.push(new GridPosition(i - 1, j - 1));
            }
            if (j < this.board.width - 1) {
              sight.push(new GridPosition(i - 1, j + 1));
            }
          } else {
            if (j > 0) {
              sight.push(new GridPosition(i + 1, j - 1));
            }
            if (j < this.board.width - 1) {
              sight.push(new GridPosition(i + 1, j + 1));
            }
          }
        }
      }
    }
    return sight;
  }

  isCheck(color, kingIndex, board) {
    var enemyColor = color === "white" ? "black" : "white";

    //Check if any enemy pieces can attack the king
    for (let i = 0; i < board.height; i++) {
      for (let j = 0; j < board.width; j++) {
        const piece = board.getSpace(i, j).getPiece();
        if (piece !== null && piece.color === enemyColor) {
          if (piece.isLegalMove(new GridPosition(i, j), kingIndex, board, this)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  isInCheck(color) {
    var king = null;
    var kingIndex = null;

    var enemyColor = color === "white" ? "black" : "white";

    //Find the king
    for (let i = 0; i < this.board.height; i++) {
      for (let j = 0; j < this.board.width; j++) {
        if (
          this.board.getSpace(i, j).getPiece() !== null &&
          this.board.getSpace(i, j).getPiece().color === color &&
          this.board.getSpace(i, j).getPiece().fenId.toLowerCase() === "k"
        ) {
          king = this.board.getSpace(i, j).getPiece();
          kingIndex = new GridPosition(i, j);
          break;
        }
      }
    }

    if (king.hasShield) {
      return false;
    }

    if (kingIndex === null) {
      console.log("No king found");
      return false;
    }

    //Check if any enemy pieces can attack the king
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board.width; j++) {
        const piece = this.board.getSpace(i, j).getPiece();
        if (piece !== null && piece.color === enemyColor) {
          if (piece.isLegalMove(new GridPosition(i, j), kingIndex, this.board, this)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  //Creates a copy of the entire game and simulates the move on the copy
  simulateMove(from, to) {
    //TODO: This works a bit differently than the move function, should be refactored to be more similar.
    //eg. why doesn't this check for legal? Why doesn't the input take a move object
    const copy = this.copy();
    const source = from;
    const target = to;
    const piece = copy.board[source.row][source.col];
    const targetPiece = copy.board[target.row][target.col];

    var moveHandled = piece.move(copy, { from: source, to: target });

    var returnVal = { isLegal: true, hitShield: false, didCapturePiece: !!targetPiece };
    var defaultAction = gameEvent("Move", copy, {
      source: source,
      target: target,
      targetPiece: targetPiece,
      piece: piece,
      moveHandled: moveHandled,
      returnVal: returnVal,
    });

    if (!moveHandled || !defaultAction) {
      copy.board[source.row][source.col] = null;
      copy.board[target.row][target.col] = piece;
    }
    copy.endTurn(true);

    return copy;
  }

  isLegalMove(from, to) {
    const source = from;
    const target = to;
    const piece = this.board.getSpace(source.row, source.col).getPiece();
    const targetPiece = this.board.getSpace(target.row, target.col).getPiece();

    if (!piece) {
      return false;
    }

    if (!piece.isLegalMove(source, target, targetPiece, this)) {
      return false;
    }

    var defaultAction = gameEvent("DoesMoveLeaveInCheck", this, { source: source, target: target, piece: piece, targetPiece: targetPiece });
    if (!defaultAction) {
      return true;
    }

    //Ensure move doesn't put or keep the player in check
    if (!this.isCopy) {
      const simulatedGame = this.simulateMove(from, to);
      if (simulatedGame.isInCheck(piece.color)) {
        return false;
      }
    }

    return true;
  }

  game_over() {
    return this.winner !== null;
  }

  async endTurn(simulatedMove = false) {
    //Flip the turn
    this.turn = this.turn === "w" ? "b" : "w";

    //Check for winner
    if (!simulatedMove) this.winner = this.getGameWinner();
    if (this.winner !== null) {
      return;
    }

    await this.board.endOfTurn(this, this.moves, simulatedMove);

    //track en passant
    if (!this.enPassant.equals(new GridPosition(-1, -1)) && !this.justDoubleMovedPawn) {
      this.enPassant = new GridPosition(-1, -1);
    }
    this.justDoubleMovedPawn = false;

    this.moves = this.getMoves();

    //End of turn for mods
    gameEvent("EndOfTurn", this, {});
  }

  fog() {
    var returnVal = { fogArr: [] };

    gameEvent("Fog", this, { returnVal: returnVal });

    return returnVal.fogArr;
  }

  async move(move) {
    const isLegal = this.isLegalMove(move.sourceSquare, move.targetSquare);

    if (isLegal) {
      const gamestate = JSON.parse(JSON.stringify(this));
      delete gamestate.history;
      this.history.push(gamestate);

      const source = move.sourceSquare;
      const target = move.targetSquare;
      const targetPiece = this.board[target.row][target.col];
      const piece = this.board[source.row][source.col];

      const moveHandled = piece.move(this, { from: source, to: target });

      var returnVal = { isLegal: isLegal, hitShield: false, didCapturePiece: !!targetPiece };
      var defaultAction = gameEvent("Move", this, {
        source: source,
        target: target,
        targetPiece: targetPiece,
        piece: piece,
        moveHandled: moveHandled,
        returnVal: returnVal,
      });

      if (!moveHandled || !defaultAction) {
        this.board[source.row][source.col] = null;
        this.board[target.row][target.col] = piece;
      }

      await this.endTurn();
      return returnVal;
    }
    return { isLegal: false, hitShield: false, didCapturePiece: false };
  }
}

let instance = null;

function getChess() {
  if (!instance) {
    instance = new Chess();
  }
  return instance;
}

export default getChess;
export { gameEventAsync, gameEvent };
