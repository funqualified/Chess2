import gameplayUIManager from "./gameplayUI";
import GridPosition from "../models/gridPosition";
import { gameEvent, gameEventAsync } from "./chess2";

class Piece {
  constructor(color, fenId, startingIndex, name = fenId, moveTypes = [], canPromote = false) {
    this.color = color;
    this.fenId = fenId;
    this.moveTypes = moveTypes;
    this.name = name;
    this.canPromote = canPromote;
    this.startingIndex = startingIndex;
    this.legalMoves = [];
    this.currentSpace = null;
  }

  setSpace(space) {
    this.currentSpace = space;
  }

  getIndex(board) {
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === this) {
          return new GridPosition(i, j);
        }
      }
    }
    return null; // Object not found in the array
  }

  async endOfTurn(game, moves, defaultAction = false) {
    gameEventAsync("PieceEndOfTurn", game, { piece: this, moves: moves });

    var index = this.getIndex(game.board);
    if (this.canPromote && ((this.color === "white" && index.row === 0) || (this.color === "black" && index.row === 7))) {
      const performDefaultAction = await gameEventAsync("Promotion", game, {
        index: index,
        piece: this,
        gameplayUIManager: gameplayUIManager,
        defaultAction: defaultAction,
        pieceFactory: pieceFactory,
      });
      console.log(performDefaultAction);
      if (performDefaultAction) {
        if (this.color !== game.playerColor) {
          game.board[index.row][index.col] = pieceFactory(game, this.color === "white" ? "q".toUpperCase() : "q".toLowerCase());
        } else {
          var fen = defaultAction
            ? "q"
            : await gameplayUIManager().choiceUI([
                { label: "Queen", response: "q" },
                { label: "Rook", response: "r" },
                { label: "Bishop", response: "b" },
                { label: "Knight", response: "n" },
              ]);
          game.board[index.row][index.col] = pieceFactory(game, this.color === "white" ? fen.toUpperCase() : fen.toLowerCase());
        }
      }
    }

    this.cacheLegalMoves(game);
  }

  getMoves() {
    return this.legalMoves;
  }

  cacheLegalMoves(game) {
    this.legalMoves = [];
    this.moveTypes.forEach((element) => {
      switch (element) {
        case "pawn":
          this.legalMoves.push.apply(this.getPawnMoves(game));
          break;
        case "knight":
          this.legalMoves.push.apply(this.getKnightMoves(game));
          break;
        case "horizontal":
          this.legalMoves.push.apply(this.getHorizontalMoves(game));
          break;
        case "vertical":
          this.legalMoves.push.apply(this.getVerticalMoves(game));
          break;
        case "diagonal":
          this.legalMoves.push.apply(this.getDiagonalMoves(game));
          break;
        case "king":
          this.legalMoves.push.apply(this.getKingMoves(game));
          break;
        case "rook":
          this.legalMoves.push.apply(this.getHorizontalMoves(game));
          this.legalMoves.push.apply(this.getVerticalMoves(game));
          break;
        default:
          console.log("Unknown move type");
          break;
      }
    });
  }

  move(game, move) {
    //can be en passant
    if (
      this.moveTypes.includes("pawn") &&
      move.from.equals(this.startingIndex) &&
      Math.abs(move.to.row - this.startingIndex.row) === 2 &&
      move.from.col == move.to.col
    ) {
      game.enPassant = new GridPosition(Math.min(move.from.row, move.to.row) + 1, move.from.col);
      game.justDoubleMovedPawn = true;
      gameEvent("PawnDoubleMoved", game, { piece: this, move: move });
    }

    //did an en passant
    if (
      this.moveTypes.includes("pawn") &&
      move.to.equals(game.enPassant) &&
      Math.abs(move.from.row - move.to.row) === 1 &&
      Math.abs(move.from.col - move.to.col) === 1
    ) {
      var targetPiece = game.board[move.from.row][move.to.col];
      var defaultAction = gameEvent("EnPassantCapture", game, { piece: this, move: move, targetPiece: targetPiece });
      if (defaultAction) {
        game.board[move.from.row][move.to.col] = null;
        game.board[move.to.row][move.to.col] = this;
      }
      return true;
    }

    if (this.moveTypes.includes("king")) {
      //Remove castling rights if king moves
      if (this.color === "white") {
        game.castling = game.castling.replace("K", "");
        game.castling = game.castling.replace("Q", "");
      }
      if (this.color === "black") {
        game.castling = game.castling.replace("k", "");
        game.castling = game.castling.replace("q", "");
      }

      //Castling
      const targetPiece = game.board[move.to.row][move.to.col];
      if (targetPiece && targetPiece.fenId.toUpperCase() === "R" && targetPiece.color === this.color) {
        //move king and rook to correct positions
        game.board[move.from.row][move.from.col] = null;
        game.board[move.to.row][move.to.col] = null;
        if (move.to.col > move.from.col) {
          game.board[move.to.row][5] = targetPiece;
          game.board[move.to.row][6] = this;
        } else {
          game.board[move.to.row][3] = targetPiece;
          game.board[move.to.row][2] = this;
        }
        return true;
      }
    }

    if (!game.isCopy && this.moveTypes.includes("rook") && move.from.col == this.startingIndex.col) {
      //get king index
      var kingIndex = null;
      for (let i = 0; i < game.board.length; i++) {
        for (let j = 0; j < game.board[i].length; j++) {
          if (game.board[i][j] && game.board[i][j].fenId.toUpperCase() === "K" && game.board[i][j].color === this.color) {
            kingIndex = new GridPosition(i, j);
          }
        }
      }

      //Remove castling rights if rook moves, using chess960 rules
      if (kingIndex != null && this.startingIndex.col < kingIndex.col) {
        game.castling = game.castling.replace(this.color === "white" ? "Q" : "q", "");
      } else {
        game.castling = game.castling.replace(this.color === "white" ? "K" : "k", "");
      }
    }
    return false;
  }

  info(game) {
    let details = "";
    details += `${this.name}\n`;
    details += `Color: ${this.color}\n`;

    var data = {
      abilities: "",
      piece: this,
    };

    gameEvent("PieceInfo", game, data);

    if (data.abilities !== "") {
      details += "Abilities:\n";
      details += data.abilities;
    }
    return details;
  }
  fen() {
    return this.color === "white" ? this.fenId.toUpperCase() : this.fenId.toLowerCase();
  }

  getPawnMoves(game) {
    var moves = [];
    // Pawn moves forward 1 space if that space is empty
    var targetSpace = this.currentSpace.getNeighborOfTypes([this.color === "white" ? "up" : "down", "vertical"]);
    if (targetSpace && targetSpace.piece === null) {
      moves.push(targetSpace);
    }

    // Pawn moves forward 2 spaces if it is on its starting row and the space in front of it is empty
    if (this.currentSpace.position.equals(this.startingIndex)) {
      targetSpace = this.currentSpace.getNeighborOfTypes([this.color === "white" ? "up" : "down", "vertical"]);
      if (targetSpace && targetSpace.piece === null) {
        targetSpace = targetSpace.getNeighborOfTypes([this.color === "white" ? "up" : "down", "vertical"]);
        if (targetSpace && targetSpace.piece === null) {
          moves.push(targetSpace);
        }
      }
    }

    // Pawn captures diagonally
    targetSpace = this.currentSpace.getNeighborOfTypes([this.color === "white" ? "up" : "down", "left", "diagonal"]);
    if (targetSpace && targetSpace.piece && targetSpace.piece.color !== this.color) {
      moves.push(targetSpace);
    }

    targetSpace = this.currentSpace.getNeighborOfTypes([this.color === "white" ? "up" : "down", "right", "diagonal"]);
    if (targetSpace && targetSpace.piece && targetSpace.piece.color !== this.color) {
      moves.push(targetSpace);
    }

    // Pawn en passant
    //TODO: implement en passant

    console.log(moves);
    return moves;
  }

  getKnightMoves(game) {
    return [];
  }

  getHorizontalMoves(game) {
    return [];
  }

  getVerticalMoves(game) {
    return [];
  }

  getDiagonalMoves(game) {
    return [];
  }

  getKingMoves(game) {
    return [];
  }
}

function clonePiece(piece) {
  var p = new Piece(piece.color, piece.fenId, piece.startingIndex, piece.name, piece.moveTypes, piece.canPromote);
  Object.keys(piece).forEach((key) => {
    p[key] = piece[key];
  });
  return p;
}

function pieceFactory(game, fenId, index) {
  const color = fenId >= "A" && fenId <= "Z" ? "white" : "black";
  var piece = new Piece(color, fenId, index);
  piece.canPromote = false;
  switch (fenId.toLowerCase()) {
    case "p":
      piece.moveTypes = ["pawn"];
      piece.name = "Pawn";
      piece.canPromote = true;
      break;
    case "b":
      piece.moveTypes = ["diagonal"];
      piece.name = "Bishop";
      break;
    case "n":
      piece.moveTypes = ["knight"];
      piece.name = "Knight";
      break;
    case "r":
      piece.moveTypes = ["rook"];
      piece.name = "Rook";
      break;
    case "q":
      piece.moveTypes = ["vertical", "horizontal", "diagonal"];
      piece.name = "Queen";
      break;
    case "k":
      piece.moveTypes = ["king"];
      piece.name = "King";
      break;
    default:
      console.log("Unrecognized piece");
  }

  gameEvent("PieceCreated", game, { piece: piece });
  return piece;
}

export default Piece;
export { clonePiece, pieceFactory };
