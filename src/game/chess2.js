import gameplayUIManager from "./gameplayUI";
import GridPosition from "../models/gridPosition";

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

class Piece {
  constructor(color, fenId, startingIndex, name = fenId, moveTypes = [], canPromote = false) {
    this.color = color;
    this.fenId = fenId;
    this.moveTypes = moveTypes;
    this.name = name;
    this.canPromote = canPromote;
    this.startingIndex = startingIndex;
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
    copy.board = this.board.map(function (innerArr) {
      return innerArr.map(function (p) {
        if (!p) {
          return null;
        }
        //deep copy move types
        var moveTypes = [];
        p.moveTypes.forEach((element) => {
          moveTypes.push(element);
        });
        return clonePiece(p);
      });
    });
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

    for (let i = 0; i < rows.length; i++) {
      const row = [];
      let col = 0;

      for (let j = 0; j < rows[i].length; j++) {
        const char = rows[i][j];

        if (isNaN(char)) {
          row.push(pieceFactory(this, char, new GridPosition(i, j)));
        } else {
          for (let o = 0; o < parseInt(char); o++) {
            row.push(null);
          }
        }
      }

      // while (row.length < 8) {
      //   row.push(null);
      // }

      this.board.push(row);
    }
    this.moves = this.getMoves();
  }

  getInitialFen() {
    var data = {
      fen: "",
    };
    const defaultAction = gameEvent("BoardSetup", this, data);
    console.log(defaultAction);
    console.log(data.fen);
    if (defaultAction) {
      data.fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    }

    return data.fen;
  }

  getPieceInfo(square) {
    const piece = this.board[square.row][square.col];
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
        const piece = this.board[i][j];
        if (piece !== null && piece.color.charAt(0) === this.turn) {
          this.movesByFrom(new GridPosition(i, j)).forEach((move) => {
            var target = this.board[move.to.row][move.to.col];
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

    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        const piece = this.board[i][j];
        if (!!piece) {
          for (let x = 0; x < this.board.length; x++) {
            for (let y = 0; y < this.board[x].length; y++) {
              if (this.isLegalMove(new GridPosition(i, j), new GridPosition(x, y))) {
                moves.push({
                  from: new GridPosition(i, j),
                  to: new GridPosition(x, y),
                });
              }
            }
          }
        }
      }
    }
    console.log(moves);
    return moves;
  }

  movesByColor(color) {
    return this.moves.filter((move) => this.board[move.from.row][move.from.col].color === color);
  }

  movesByFrom(from) {
    return this.moves.filter((move) => move.from.equals(from));
  }

  AIMoves(color) {
    let moves = this.movesByColor(color);

    //Sort moves by best to worst
    moves.sort((a, b) => {
      const pieceA = this.board[a.from.row][a.from.col];
      const pieceB = this.board[b.from.row][b.from.col];
      const targetPieceA = this.board[a.to.row][a.to.col];
      const targetPieceB = this.board[b.to.row][b.to.col];

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
      const center = new GridPosition(Math.floor(this.board.length / 2), Math.floor(this.board[0].length / 2));
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
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        const piece = this.board[i][j];
        if (!!piece && piece.moveTypes.includes("pawn") && piece.color === this.playerColor) {
          if (piece.color === "white") {
            if (j > 0) {
              sight.push(new GridPosition(i - 1, j - 1));
            }
            if (j < this.board[i].length - 1) {
              sight.push(new GridPosition(i - 1, j + 1));
            }
          } else {
            if (j > 0) {
              sight.push(new GridPosition(i + 1, j - 1));
            }
            if (j < this.board[i].length - 1) {
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
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        const piece = board[i][j];
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
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        if (this.board[i][j] !== null && this.board[i][j].color === color && this.board[i][j].fenId.toLowerCase() === "k") {
          king = this.board[i][j];
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
      for (let j = 0; j < this.board[i].length; j++) {
        const piece = this.board[i][j];
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
    const piece = this.board[source.row][source.col];
    const targetPiece = this.board[target.row][target.col];

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

    //Run end of turn for all pieces
    for (let x = 0; x < this.board.length; x++) {
      for (let y = 0; y < this.board[x].length; y++) {
        await this.board[x][y]?.endOfTurn(this, this.moves, simulatedMove);
      }
    }

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
export { Piece, clonePiece };
