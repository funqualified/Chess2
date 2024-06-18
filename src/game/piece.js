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
    for (let i = 0; i < game.board.spaces.length; i++) {
      if (game.board.spaces[i].getPiece() !== this && this.isLegalMove(game.board.spaces[i].position, game.board.spaces[i].position, null, game)) {
        this.legalMoves.push(game.board.spaces[i].position);
      }
    }
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
  isLegalMove(source, target, targetPiece, game) {
    let isMoveLegal = false;
    this.moveTypes.forEach((element) => {
      switch (element) {
        case "pawn":
          if (this.pawnMove(source, target, targetPiece, game)) {
            isMoveLegal = true;
          }
          break;
        case "knight":
          if (this.knightMove(source, target, targetPiece, game)) {
            isMoveLegal = true;
          }
          break;
        case "horizontal":
          if (this.horizontalMove(source, target, targetPiece, game)) {
            isMoveLegal = true;
          }
          break;
        case "vertical":
          if (this.verticalMove(source, target, targetPiece, game)) {
            isMoveLegal = true;
          }
          break;
        case "diagonal":
          if (this.diagonalMove(source, target, targetPiece, game)) {
            isMoveLegal = true;
          }
          break;
        case "king":
          if (this.kingMove(source, target, targetPiece, game)) {
            isMoveLegal = true;
          }
          break;
        case "rook":
          if (this.horizontalMove(source, target, targetPiece, game) || this.verticalMove(source, target, targetPiece, game)) {
            isMoveLegal = true;
          }
          break;
        default:
          console.log("Unknown move type");
          break;
      }
    });
    return isMoveLegal;
  }

  pawnMove(source, target, targetPiece, game) {
    if (!!targetPiece && this.color === targetPiece.color) {
      return false;
    }

    if (this.color === "white") {
      if (source.col === target.col) {
        if (source.row - target.row === 2 && source.row === 6 && !targetPiece && !game.board[source.row - 1][source.col]) {
          // Pawn moves 2 spaces on its first move
          return true;
        } else if (source.row - target.row === 1 && !targetPiece) {
          // Pawn moves forward 1 space
          return true;
        }
      } else if (Math.abs(source.col - target.col) === 1 && source.row - target.row === 1 && (!!targetPiece || game.enPassant.equals(target))) {
        // Pawn captures diagonally
        return true;
      } else if (
        game.mods.includes("WRAP") &&
        source.row - target.row === 1 &&
        (!!targetPiece || game.enPassant.equals(target)) &&
        ((source.col === 0 && target.col === game.board[source.row].length - 1) || (source.col === game.board[source.row].length - 1 && target.col === 0))
      ) {
        //Pawn captures diagonally over wrap
        return true;
      }
    } else {
      if (source.col === target.col) {
        if (source.row - target.row === -2 && source.row === 1 && !targetPiece && !game.board[source.row + 1][source.col]) {
          // Pawn moves 2 spaces on its first move
          return true;
        } else if (source.row - target.row === -1 && !targetPiece) {
          // Pawn moves forward 1 space
          return true;
        }
      } else if (Math.abs(source.col - target.col) === 1 && source.row - target.row === -1 && (!!targetPiece || game.enPassant.equals(target))) {
        // Pawn captures diagonally
        return true;
      } else if (
        game.mods.includes("WRAP") &&
        source.row - target.row === -1 &&
        (!!targetPiece || game.enPassant.equals(target)) &&
        ((source.col === 0 && target.col === game.board[source.row].length - 1) || (source.col === game.board[source.row].length - 1 && target.col === 0))
      ) {
        //Pawn captures diagonally over wrap
        return true;
      }
    }
    return false;
  }

  knightMove(source, target, targetPiece, game) {
    if (!!targetPiece && this.color === targetPiece.color) {
      return false;
    }

    if (
      (Math.abs(source.row - target.row) === 2 && Math.abs(source.col - target.col) === 1) ||
      (Math.abs(source.row - target.row) === 1 && Math.abs(source.col - target.col) === 2)
    ) {
      // Knight moves in L shape
      return true;
    }
    if (
      (game.mods.includes("WRAP") && Math.abs(source.row - target.row) === 2 && Math.abs(source.col - target.col) === game.board[source.row].length - 1) ||
      (game.mods.includes("WRAP") && Math.abs(source.row - target.row) === 1 && Math.abs(source.col - target.col) === game.board[source.row].length - 2)
    ) {
      return true;
    }
    return false;
  }

  horizontalMove(source, target, targetPiece, game) {
    if (!!targetPiece && this.color === targetPiece.color) {
      return false;
    }

    if (source.row === target.row) {
      const minRow = Math.min(source.col, target.col);
      const maxRow = Math.max(source.col, target.col);
      for (let i = minRow + 1; i < maxRow; i++) {
        if (game.board[source.row][i]) {
          if (game.mods.includes("WRAP")) {
            for (let o = maxRow + 1; o !== minRow; o++) {
              if (o >= game.board[source.row].length) {
                o = 0;
                if (minRow === o) {
                  return true;
                }
              }
              if (game.board[source.row][o]) {
                return false;
              }
            }
          } else {
            return false;
          }
        }
      }
      return true;
    }
    return false;
  }

  verticalMove(source, target, targetPiece, game) {
    if (!!targetPiece && this.color === targetPiece.color) {
      return false;
    }

    if (source.col === target.col) {
      // Rook moves vertically
      const minCol = Math.min(source.row, target.row);
      const maxCol = Math.max(source.row, target.row);
      for (let j = minCol + 1; j < maxCol; j++) {
        if (game.board[j][source.col]) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  diagonalMove(source, target, targetPiece, game) {
    if (!!targetPiece && this.color === targetPiece.color) {
      return false;
    }

    if (Math.abs(source.row - target.row) === Math.abs(source.col - target.col)) {
      // Bishop moves diagonally
      const startRow = source.col;
      const startCol = source.row;
      let colIncrement = 1;
      let rowIncrement = 1;

      if (source.row > target.row) {
        colIncrement = -1; // moving from bottom-right to top-left or vice versa
      }

      if (source.col > target.col) {
        rowIncrement = -1;
      }
      let canAccessNormal = true;
      for (
        let i = startRow + rowIncrement, j = startCol + colIncrement;
        (rowIncrement > 0 ? i < target.col : i > target.col) && (colIncrement > 0 ? j < target.row : j > target.row);
        i += rowIncrement, j += colIncrement
      ) {
        if (game.board[j][i]) {
          canAccessNormal = false;
        }
      }
      if (canAccessNormal) {
        return true;
      }
    }
    if (
      game.mods.includes("WRAP") &&
      (Math.abs(source.row - target.row + 8) === Math.abs(source.col - target.col) ||
        Math.abs(source.row - target.row) === Math.abs(source.col - target.col + 8) ||
        Math.abs(source.row - target.row - 8) === Math.abs(source.col - target.col) ||
        Math.abs(source.row - target.row) === Math.abs(source.col - target.col - 8))
    ) {
      if (source.row < target.row && source.col > target.col) {
        //UR
        for (let x = source.row + 1, y = source.col + 1; x !== target.row && y !== target.col; x++, y++) {
          if (x >= game.board.length || x < 0) {
            return false;
          }
          if (y >= game.board[source.row].length) {
            y = 0;
            if (x === target.row && y === target.col) {
              return true;
            }
          }
          if (game.board[x][y]) {
            return false;
          }
        }
        return true;
      } else if (source.row < target.row && source.col < target.col) {
        //UL
        for (let x = source.row + 1, y = source.col - 1; x !== target.row && y !== target.col; x++, y--) {
          if (x >= game.board.length || x < 0) {
            return false;
          }
          if (y < 0) {
            y = game.board[source.row].length - 1;
            if (x === target.row && y === target.col) {
              return true;
            }
          }
          if (game.board[x][y]) {
            return false;
          }
        }
        return true;
      } else if (source.row > target.row && source.col < target.col) {
        //DL
        for (let x = source.row - 1, y = source.col - 1; x !== target.row && y !== target.col; x--, y--) {
          if (x >= game.board.length || x < 0) {
            return false;
          }
          if (y < 0) {
            y = game.board[source.row].length - 1;
            if (x === target.row && y === target.col) {
              return true;
            }
          }
          if (game.board[x][y]) {
            return false;
          }
        }
        return true;
      } else if (source.row > target.row && source.col > target.col) {
        //DR
        for (let x = source.row - 1, y = source.col + 1; x !== target.row && y !== target.col; x--, y++) {
          if (x >= game.board.length || x < 0) {
            return false;
          }
          if (y >= game.board[source.row].length) {
            y = 0;
            if (x === target.row && y === target.col) {
              return true;
            }
          }
          if (game.board[x][y]) {
            return false;
          }
        }
        return true;
      }
      return false;
    }
    return false;
  }

  kingMove(source, target, targetPiece, game) {
    if (Math.abs(source.row - target.row) <= 1 && Math.abs(source.col - target.col) <= 1) {
      if (!!targetPiece && this.color === targetPiece.color) {
        return false;
      }
      // King moves 1 space in any direction
      return true;
    } else if (
      targetPiece &&
      targetPiece.fenId &&
      targetPiece.fenId.toUpperCase() === "R" &&
      targetPiece.color === this.color &&
      game.castling.includes(source.col < target.col ? (this.color === "white" ? "K" : "k") : this.color === "white" ? "Q" : "q")
    ) {
      //Check if there is an obstruction between the king and rook and the end spaces
      const kingEndCol = source.col < target.col ? 6 : 2;
      const rookEndCol = source.col < target.col ? 5 : 3;
      const minCol = Math.min(source.col, target.col, kingEndCol, rookEndCol);
      const maxCol = Math.max(source.col, target.col, kingEndCol, rookEndCol);
      for (let j = minCol; j <= maxCol; j++) {
        if (game.board[source.row][j] && game.board[source.row][j] !== this && game.board[source.row][j] !== targetPiece) {
          return false;
        }
      }
      // Check if there is a check between the king start and end spaces
      const minCol2 = Math.min(source.col, kingEndCol);
      const maxCol2 = Math.max(source.col, kingEndCol);
      for (let j = minCol2; j <= maxCol2; j++) {
        if (game.isCheck(this.color, [source.row, j], game.board)) {
          return false;
        }
      }

      // King castles
      return true;
    } else if (game.mods.includes("WRAP")) {
      if (!!targetPiece && this.color === targetPiece.color) {
        return false;
      }
      if (
        (Math.abs(source.row - target.row) <= 1 && source.col === 0 && target.col === game.board[target.row].length - 1) ||
        (source.col === game.board[source.col].length - 1 && target.col === 0)
      ) {
        // King moves 1 space in any direction over wrap
        return true;
      }
    }
    return false;
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
