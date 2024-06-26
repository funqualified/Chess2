import GridPosition from "../models/gridPosition";
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
    do {
      if (this.history.length > 0) {
        const move = this.history.pop();
        this.board.restore(move.board);
        this.turn = move.turn;
        this.castling = move.castling;
        this.enPassant = new GridPosition(move.enPassant.row, move.enPassant.col);
        this.winner = null;
        this.moves = this.getMoves();
      }
    } while (this.turn !== this.playerColor.charAt(0) && this.history.length > 0);
  }

  copy() {
    const copy = new Chess();
    var boardSave = this.board.save();
    var boardCopy = new Board(copy);
    boardCopy.restore(boardSave);
    copy.board = boardCopy;
    copy.moves = this.moves;
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
    this.moves = [];
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

    this.board = new Board(this, fen);
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
    const piece = this.board.getSpace(new GridPosition(square.row, square.col)).getPiece();
    var data = {
      piece: piece,
      info: null,
    };
    const defaultAction = gameEvent("GetPieceInfo", this, data);

    if (!defaultAction) {
      return data.info;
    }

    if (piece) {
      return piece.info(this);
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

    this.moves.forEach((move) => {
      const piece = this.board.getSpace(move.from).getPiece();
      const target = this.board.getSpace(move.to).getPiece();
      if (piece !== null && piece.color.charAt(0) === this.turn) {
        hasValidMove = true;
      }
    });

    if (!hasValidMove) {
      return this.turn === "w" ? "black" : "white";
    }

    return winner;
  }

  getMoves() {
    let moves = [];

    for (let i = 0; i < this.board.height; i++) {
      for (let j = 0; j < this.board.width; j++) {
        const piece = this.board.getSpace(new GridPosition(i, j)).getPiece();
        if (!!piece) {
          piece.cacheLegalMoves(this);
          piece.legalMoves.forEach((move) => {
            moves.push({ from: new GridPosition(i, j), to: new GridPosition(move.row, move.col) }); //TODO: convert this system to use move objects
          });
        }
      }
    }

    if (!this.isCopy) {
      //TODO: Invalid moves are not being filtered out
      //Filter out moves that would put the player in check
      moves = moves.filter((move) => {
        if (this.board.getSpace(move.from).getPiece().color[0] !== this.turn) return true;
        const copy = this.simulateMove(move.from, move.to);
        const kingPosition = copy.board.spaces.find((space) => {
          return space.getPiece() !== null && space.getPiece().color[0] === this.turn && space.getPiece().fenId.toLowerCase() === "k";
        }).position;
        const remove = copy.isCheck(kingPosition);
        console.log("remove", remove);
        return !remove;
      });
    }

    return moves;
  }

  movesByColor(color) {
    return this.moves.filter((move) => this.board.getSpace(move.from).getPiece().color === color);
  }

  movesByFrom(from) {
    return this.moves.filter((move) => move.from.equals(from));
  }

  AIMoves(color) {
    let moves = this.movesByColor(color);

    //Sort moves by best to worst
    moves.sort((a, b) => {
      const pieceA = this.board.getSpace(a.from).getPiece();
      const pieceB = this.board.getSpace(b.from).getPiece();
      const targetPieceA = this.board.getSpace(a.to).getPiece();
      const targetPieceB = this.board.getSpace(b.to).getPiece();

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

  //TODO: Refactor this function into the mods system
  getPlayerSight(color) {
    let sight = [];
    this.movesByColor(color).forEach((move) => {
      sight.push(move.to);
    });
    //Add all pawn forward diagonals to sight
    for (let i = 0; i < this.board.height; i++) {
      for (let j = 0; j < this.board.width; j++) {
        const piece = this.board.getSpace(new GridPosition(i, j)).getPiece();
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

  isCheck(kingPosition) {
    var targetPiece = this.board.getSpace(kingPosition).getPiece();
    var enemyColor = targetPiece.color === "white" ? "black" : "white";

    //Check if any enemy pieces can attack the king
    var targetInCheck = false;
    this.moves.forEach((element) => {
      const attackingPiece = this.board.getSpace(element.from).getPiece();
      const isAttackingKing = element.to.equals(kingPosition);
      if (isAttackingKing) {
        if (attackingPiece) {
          if (attackingPiece.color === enemyColor) {
            targetInCheck = true;
            return;
          }
        }
      }
    });

    return targetInCheck;
  }

  isLegalMove(from, to) {
    var isLegal = false;
    this.moves.forEach((move) => {
      if (move.from.equals(from) && move.to.equals(to)) {
        isLegal = true;
        return;
      }
    });
    return isLegal;

    //TODO: This function used to be much more complex. Check before this commit if the new code turns out to not work
  }

  game_over() {
    return this.winner !== null;
  }

  async endTurn(simulatedMove = false) {
    //Flip the turn
    this.turn = this.turn === "w" ? "b" : "w";

    if (simulatedMove) {
      this.board.endOfTurn(this, this.moves, simulatedMove);
    } else {
      await this.board.endOfTurn(this, this.moves, simulatedMove);
    }

    //track en passant
    if (!this.enPassant.equals(new GridPosition(-1, -1)) && !this.justDoubleMovedPawn) {
      this.enPassant = new GridPosition(-1, -1);
    }
    this.justDoubleMovedPawn = false;

    this.moves = this.getMoves();

    //Check for winner
    if (!simulatedMove) this.winner = this.getGameWinner();
    if (this.winner !== null) {
      return;
    }

    //End of turn for mods
    gameEvent("EndOfTurn", this, {});
  }

  fog() {
    var returnVal = { fogArr: [] };

    gameEvent("Fog", this, { returnVal: returnVal });

    return returnVal.fogArr;
  }

  //Creates a copy of the entire game and simulates the move on the copy
  simulateMove(from, to) {
    const copy = this.copy();

    const source = from;
    const target = to;
    const targetPiece = copy.board.getSpace(target).getPiece();
    const piece = copy.board.getSpace(source).getPiece();

    const moveHandled = piece.move(copy, { from: source, to: target });

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
      copy.board.getSpace(source).setPiece(null);
      copy.board.getSpace(target).setPiece(piece);
    }
    copy.endTurn(true);

    return copy;
  }

  async move(move) {
    const isLegal = this.isLegalMove(move.sourceSquare, move.targetSquare);

    if (isLegal) {
      const gamestate = JSON.parse(JSON.stringify(this));
      delete gamestate.history;
      this.history.push(gamestate);

      const source = move.sourceSquare;
      const target = move.targetSquare;
      const targetPiece = this.board.getSpace(target).getPiece();
      const piece = this.board.getSpace(source).getPiece();

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
        this.board.getSpace(source).setPiece(null);
        this.board.getSpace(target).setPiece(piece);
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
