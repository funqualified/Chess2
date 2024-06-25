import gameplayUIManager from "./gameplayUI";
import GridPosition from "../models/gridPosition";
import { gameEvent, gameEventAsync } from "./chess2";
import Chess from "./chess2";

class Piece {
  constructor(color, fenId, startingPosition, name = fenId, moveTypes = [], canPromote = false) {
    this.color = color;
    this.fenId = fenId;
    this.moveTypes = moveTypes;
    this.name = name;
    this.canPromote = canPromote;
    this.startingPosition = startingPosition;
    this.legalMoves = [];
    this.currentPosition = null;
  }

  save() {
    return {
      color: this.color,
      fenId: this.fenId,
      moveTypes: this.moveTypes,
      name: this.name,
      canPromote: this.canPromote,
      startingPosition: { row: this.startingPosition.row, col: this.startingPosition.col },
      legalMoves: this.legalMoves.map((move) => {
        return { row: move.row, col: move.col };
      }),
      currentPosition: { row: this.currentPosition.row, col: this.currentPosition.col },
    };
  }

  restore(state) {
    this.color = state.color;
    this.fenId = state.fenId;
    this.moveTypes = state.moveTypes;
    this.name = state.name;
    this.canPromote = state.canPromote;
    this.startingPosition = new GridPosition(state.startingPosition.row, state.startingPosition.col);
    this.legalMoves = state.legalMoves.map((move) => {
      return new GridPosition(move.row, move.col);
    });
    this.currentPosition = new GridPosition(state.currentPosition.row, state.currentPosition.col);
  }

  setPosition(position) {
    this.currentPosition = position;
  }

  getCurrentSpace() {
    return this.currentPosition ? Chess().board.getSpace(this.currentPosition) : null;
  }

  async endOfTurn(game, moves, defaultAction = false) {
    gameEventAsync("PieceEndOfTurn", game, { piece: this, moves: moves });

    //Promotion
    if (
      this.canPromote &&
      ((this.color === "white" && this.currentPosition.row === 0) || (this.color === "black" && this.currentPosition.row === game.board.height - 1))
    ) {
      const performDefaultAction = await gameEventAsync("Promotion", game, {
        position: this.currentPosition,
        piece: this,
        gameplayUIManager: gameplayUIManager,
        defaultAction: defaultAction,
        pieceFactory: pieceFactory,
      });

      if (performDefaultAction) {
        if (this.color !== game.playerColor) {
          this.fenId = this.color === "white" ? "q".toUpperCase() : "q".toLowerCase();
          this.moveTypes = ["vertical", "horizontal", "diagonal"];
        } else {
          var fen = defaultAction
            ? "q"
            : await gameplayUIManager().choiceUI([
                { label: "Queen", response: "q" },
                { label: "Rook", response: "r" },
                { label: "Bishop", response: "b" },
                { label: "Knight", response: "n" },
              ]);
          this.fenId = this.color === "white" ? fen.toUpperCase() : fen.toLowerCase();
          switch (fen) {
            case "q":
              this.moveTypes = ["vertical", "horizontal", "diagonal"];
              break;
            case "r":
              this.moveTypes = ["rook"];
              break;
            case "b":
              this.moveTypes = ["diagonal"];
              break;
            case "n":
              this.moveTypes = ["knight"];
              break;
            default:
              console.log("Unknown piece type");
              break;
          }
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
      var moves = [];
      switch (element) {
        case "pawn":
          moves = this.getPawnMoves(game);
          moves.forEach((move) => {
            this.legalMoves.push(move);
          });
          break;
        case "knight":
          moves = this.getKnightMoves(game);
          moves.forEach((move) => {
            this.legalMoves.push(move);
          });
          break;
        case "horizontal":
          moves = this.getHorizontalMoves(game);
          moves.forEach((move) => {
            this.legalMoves.push(move);
          });
          break;
        case "vertical":
          moves = this.getVerticalMoves(game);
          moves.forEach((move) => {
            this.legalMoves.push(move);
          });
          break;
        case "diagonal":
          moves = this.getDiagonalMoves(game);
          moves.forEach((move) => {
            this.legalMoves.push(move);
          });
          break;
        case "king":
          moves = this.getKingMoves(game);
          moves.forEach((move) => {
            this.legalMoves.push(move);
          });
          break;
        case "rook":
          moves = this.getHorizontalMoves(game);
          moves.forEach((move) => {
            this.legalMoves.push(move);
          });
          moves = this.getVerticalMoves(game);
          moves.forEach((move) => {
            this.legalMoves.push(move);
          });
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
      move.from.equals(this.startingPosition) &&
      Math.abs(move.to.row - this.startingPosition.row) === 2 &&
      move.from.col === move.to.col
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
      var targetPiece = game.board.getSpace(new GridPosition(move.from.row, move.to.col)).getPiece();
      var defaultAction = gameEvent("EnPassantCapture", game, { piece: this, move: move, targetPiece: targetPiece });
      if (defaultAction) {
        game.board.getSpace(new GridPosition(move.from.row, move.to.col)).setPiece(null);
        game.board.getSpace(move.to).setPiece(this);
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
      const targetPiece = game.board.getSpace(move.to).getPiece();
      if (targetPiece && targetPiece.fenId.toUpperCase() === "R" && targetPiece.color === this.color) {
        //move king and rook to correct positions
        game.board.getSpace(move.from).setPiece(null);
        game.board.getSpace(move.to).setPiece(null);
        //TODO: remove hardcoding
        if (move.to.col > move.from.col) {
          game.board.getSpace(new GridPosition(move.to.row, 5)).setPiece(targetPiece);
          game.board.getSpace(new GridPosition(move.to.row, 6)).setPiece(this);
        } else {
          game.board.getSpace(new GridPosition(move.to.row, 3)).setPiece(targetPiece);
          game.board.getSpace(new GridPosition(move.to.row, 2)).setPiece(this);
        }
        return true;
      }
    }

    if (!game.isCopy && this.moveTypes.includes("rook") && move.from.col === this.startingPosition.col) {
      //get king index
      var kingIndex = null;
      game.board.forEach((space) => {
        if (space.piece && space.piece.fenId.toUpperCase() === "K" && space.piece.color === this.color) {
          kingIndex = space.position;
          return;
        }
      });

      //Remove castling rights if rook moves, using chess960 rules
      if (kingIndex != null && this.startingPosition.col < kingIndex.col) {
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
    var targetSpace = this.getCurrentSpace().getNeighborOfType(this.color === "white" ? "up" : "down");
    if (targetSpace && targetSpace.piece === null) {
      moves.push(targetSpace.position);
    }

    // Pawn moves forward 2 spaces if it is on its starting row and the space in front of it is empty
    if (this.currentPosition.equals(this.startingPosition)) {
      targetSpace = this.getCurrentSpace().getNeighborOfType(this.color === "white" ? "up" : "down");
      if (targetSpace && targetSpace.piece === null) {
        targetSpace = targetSpace.getNeighborOfType(this.color === "white" ? "up" : "down");
        if (targetSpace && targetSpace.piece === null) {
          moves.push(targetSpace.position);
        }
      }
    }

    // Pawn captures diagonally
    targetSpace = this.getCurrentSpace().getNeighborOfType(this.color === "white" ? "upleft" : "downleft");
    if (targetSpace && targetSpace.piece && targetSpace.piece.color !== this.color) {
      moves.push(targetSpace.position);
    }

    targetSpace = this.getCurrentSpace().getNeighborOfType(this.color === "white" ? "upright" : "downright");
    if (targetSpace && targetSpace.piece && targetSpace.piece.color !== this.color) {
      moves.push(targetSpace.position);
    }

    // Pawn en passant TODO: fix this
    if (game.justDoubleMovedPawn) {
      if (this.currentPosition.equals(game.board.getSpace(game.enPassant).getNeighborOfType(this.color === "white" ? "downleft" : "upleft"))) {
        moves.push(game.enPassant);
      }
      if (this.currentPosition.equals(game.board.getSpace(game.enPassant).getNeighborOfType(this.color === "white" ? "downright" : "upright"))) {
        moves.push(game.enPassant);
      }
    }

    return moves;
  }

  getKnightMoves(game) {
    var moves = [];
    var space = this.getCurrentSpace();
    var uptwo = space?.getNeighborOfType("up")?.getNeighborOfType("up");
    var downtwo = space?.getNeighborOfType("down")?.getNeighborOfType("down");
    var lefttwo = space?.getNeighborOfType("left")?.getNeighborOfType("left");
    var righttwo = space?.getNeighborOfType("right")?.getNeighborOfType("right");

    if (uptwo) {
      var upleft = uptwo.getNeighborOfType("left");
      var upright = uptwo.getNeighborOfType("right");
      if (upleft && (upleft.piece === null || upleft.piece.color !== this.color)) {
        moves.push(upleft.position);
      }
      if (upright && (upright.piece === null || upright.piece.color !== this.color)) {
        moves.push(upright.position);
      }
    }

    if (downtwo) {
      var downleft = downtwo.getNeighborOfType("left");
      var downright = downtwo.getNeighborOfType("right");
      if (downleft && (downleft.piece === null || downleft.piece.color !== this.color)) {
        moves.push(downleft.position);
      }
      if (downright && (downright.piece === null || downright.piece.color !== this.color)) {
        moves.push(downright.position);
      }
    }

    if (lefttwo) {
      var leftup = lefttwo.getNeighborOfType("up");
      var leftdown = lefttwo.getNeighborOfType("down");
      if (leftup && (leftup.piece === null || leftup.piece.color !== this.color)) {
        moves.push(leftup.position);
      }
      if (leftdown && (leftdown.piece === null || leftdown.piece.color !== this.color)) {
        moves.push(leftdown.position);
      }
    }

    if (righttwo) {
      var rightup = righttwo.getNeighborOfType("up");
      var rightdown = righttwo.getNeighborOfType("down");
      if (rightup && (rightup.piece === null || rightup.piece.color !== this.color)) {
        moves.push(rightup.position);
      }
      if (rightdown && (rightdown.piece === null || rightdown.piece.color !== this.color)) {
        moves.push(rightdown.position);
      }
    }

    return moves;
  }

  getHorizontalMoves(game) {
    var moves = [];
    var space = this.getCurrentSpace();
    var left = space.getNeighborOfType("left");
    while (left) {
      if (left.piece === null) {
        moves.push(left.position);
      } else if (left.piece.color !== this.color) {
        moves.push(left.position);
        break;
      } else {
        break;
      }
      left = left.getNeighborOfType("left");
    }

    var right = space.getNeighborOfType("right");
    while (right) {
      if (right.piece === null) {
        moves.push(right.position);
      } else if (right.piece.color !== this.color) {
        moves.push(right.position);
        break;
      } else {
        break;
      }
      right = right.getNeighborOfType("right");
    }

    return moves;
  }

  getVerticalMoves(game) {
    var moves = [];
    var space = this.getCurrentSpace();
    var up = space.getNeighborOfType("up");
    while (up) {
      if (up.piece === null) {
        moves.push(up.position);
      } else if (up.piece.color !== this.color) {
        moves.push(up.position);
        break;
      } else {
        break;
      }
      up = up.getNeighborOfType("up");
    }

    var down = space.getNeighborOfType("down");
    while (down) {
      if (down.piece === null) {
        moves.push(down.position);
      } else if (down.piece.color !== this.color) {
        moves.push(down.position);
        break;
      } else {
        break;
      }
      down = down.getNeighborOfType("down");
    }

    return moves;
  }

  getDiagonalMoves(game) {
    var moves = [];
    var space = this.getCurrentSpace();
    var upleft = space.getNeighborOfType("upleft");
    while (upleft) {
      if (upleft.piece === null) {
        moves.push(upleft.position);
      } else if (upleft.piece.color !== this.color) {
        moves.push(upleft.position);
        break;
      } else {
        break;
      }
      upleft = upleft.getNeighborOfType("upleft");
    }

    var upright = space.getNeighborOfType("upright");
    while (upright) {
      if (upright.piece === null) {
        moves.push(upright.position);
      } else if (upright.piece.color !== this.color) {
        moves.push(upright.position);
        break;
      } else {
        break;
      }
      upright = upright.getNeighborOfType("upright");
    }

    var downleft = space.getNeighborOfType("downleft");
    while (downleft) {
      if (downleft.piece === null) {
        moves.push(downleft.position);
      } else if (downleft.piece.color !== this.color) {
        moves.push(downleft.position);
        break;
      } else {
        break;
      }
      downleft = downleft.getNeighborOfType("downleft");
    }

    var downright = space.getNeighborOfType("downright");
    while (downright) {
      if (downright.piece === null) {
        moves.push(downright.position);
      } else if (downright.piece.color !== this.color) {
        moves.push(downright.position);
        break;
      } else {
        break;
      }
      downright = downright.getNeighborOfType("downright");
    }

    return moves;
  }

  getKingMoves(game) {
    var moves = [];
    var space = this.getCurrentSpace();
    var up = space.getNeighborOfType("up");
    if (up && (up.piece === null || up.piece.color !== this.color)) {
      moves.push(up.position);
    }
    var down = space.getNeighborOfType("down");
    if (down && (down.piece === null || down.piece.color !== this.color)) {
      moves.push(down.position);
    }
    var left = space.getNeighborOfType("left");
    if (left && (left.piece === null || left.piece.color !== this.color)) {
      moves.push(left.position);
    }
    var right = space.getNeighborOfType("right");
    if (right && (right.piece === null || right.piece.color !== this.color)) {
      moves.push(right.position);
    }
    var upleft = space.getNeighborOfType("upleft");
    if (upleft && (upleft.piece === null || upleft.piece.color !== this.color)) {
      moves.push(upleft.position);
    }
    var upright = space.getNeighborOfType("upright");
    if (upright && (upright.piece === null || upright.piece.color !== this.color)) {
      moves.push(upright.position);
    }
    var downleft = space.getNeighborOfType("downleft");
    if (downleft && (downleft.piece === null || downleft.piece.color !== this.color)) {
      moves.push(downleft.position);
    }
    var downright = space.getNeighborOfType("downright");
    if (downright && (downright.piece === null || downright.piece.color !== this.color)) {
      moves.push(downright.position);
    }

    //TODO: castling

    return moves;
  }
}

function clonePiece(piece) {
  var p = new Piece(piece.color, piece.fenId, piece.startingPosition, piece.name, piece.moveTypes, piece.canPromote);
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
