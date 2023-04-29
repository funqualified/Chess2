const GameTags = {
  FOG: "You can only see spaces your pieces can move to",
  STAMINA: "Each piece needs stamina to move",
  VAMPIRE: "Pieces gain the powers of pieces they've captured",
  SHIELDS: "Pieces can have a shield that prevents capture, consumed on use",
  WRAP: "The left and right sides of the board wrap around",
  LOYALTY: "Pieces may defect to the other side",
  HITCHANCE: "Pieces may fail to capture",
  BOMBERS:
    "Pieces explode after X moves, capturing themselves and adjecent spaces",
  RELOAD: "Pawn promotion requires a quicktime minigame",
};

function piece(fenId) {
  const color = fenId >= "A" && fenId <= "Z" ? "white" : "black";
  switch (fenId.toLowerCase()) {
    case "p":
      return new Piece(color, fenId, "Pawn", ["pawn"], true);
    case "b":
      return new Piece(color, fenId, "Bishop", ["diagonal"]);
    case "n":
      return new Piece(color, fenId, "Knight", ["knight"]);
    case "r":
      return new Piece(color, fenId, "Rook", ["vertical", "horizontal"]);
    case "q":
      return new Piece(color, fenId, "Queen", [
        "vertical",
        "horizontal",
        "diagonal",
      ]);
    case "k":
      return new Piece(color, fenId, "King", ["king"], false, 100);
    default:
      console.log("Unrecognized piece");
      return new Piece(color, fenId);
  }
}

class Piece {
  constructor(
    color,
    fenId,
    name = fenId,
    moveTypes = [],
    hasShield = false,
    loyalty = 10
  ) {
    this.color = color;
    this.fenId = fenId;
    this.moveTypes = moveTypes;
    this.hasShield = hasShield;
    this.name = name;
    this.loyalty = loyalty;
  }

  endOfTurn(game, moves) {
    if (game.mods.includes(GameTags.LOYALTY)) {
      if (this.fenId.toLowerCase() === "k") {
        this.loyalty = 100;
      } else {
        this.loyalty += 1;
        moves.forEach((move) => {
          const index = algebraicToIndex(move.to);
          if (game.board[index[0]][index[1]] === this) {
            this.loyalty -= 2;
          }
        });
      }
      if (this.loyalty > 100) {
        this.loyalty = 100;
      }
      if (this.loyalty < 0) {
        this.loyalty = Math.abs(this.loyalty);
        this.color = this.color == "white" ? "black" : "white";
      }
    }
  }

  info(game) {
    let details = "";
    details += `${this.color.charAt(0).toUpperCase() + this.color.slice(1)} ${
      this.name
    }\n`;
    details += "Abilities:\n";
    if (game.mods.includes(GameTags.VAMPIRE)) {
      details += "Move " + this.moveTypes + "\n";
    }
    if (game.mods.includes(GameTags.SHIELDS) && this.hasShield) {
      details += "Shielded\n";
    }
    if (game.mods.includes(GameTags.LOYALTY)) {
      details += `Loyalty:${this.loyalty}\n`;
    }
    return details;
  }
  fen() {
    return this.color === "white"
      ? this.fenId.toUpperCase()
      : this.fenId.toLowerCase();
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
        default:
          console.log("Unknown move type");
          break;
      }
    });
    return isMoveLegal;
  }

  pawnMove(source, target, targetPiece, game) {
    if (this.color == "white") {
      if (source[1] === target[1]) {
        if (
          source[0] - target[0] === 2 &&
          source[0] === 6 &&
          !targetPiece &&
          !game.board[source[0] - 1][source[1]]
        ) {
          // Pawn moves 2 spaces on its first move
          return true;
        } else if (source[0] - target[0] === 1 && !targetPiece) {
          // Pawn moves forward 1 space
          return true;
        }
      } else if (
        Math.abs(source[1] - target[1]) === 1 &&
        source[0] - target[0] === 1 &&
        !!targetPiece
      ) {
        // Pawn captures diagonally
        return true;
      } else if (
        game.mods.includes(GameTags.WRAP) &&
        source[0] - target[0] === 1 &&
        !!targetPiece &&
        ((source[1] === 0 && target[1] === game.board[source[0]].length - 1) ||
          (source[1] === game.board[source[0]].length - 1 && target[1] === 0))
      ) {
        //Pawn captures diagonally over wrap
        return true;
      }
    } else {
      if (source[1] === target[1]) {
        if (
          source[0] - target[0] === -2 &&
          source[0] === 1 &&
          !targetPiece &&
          !game.board[source[0] + 1][source[1]]
        ) {
          // Pawn moves 2 spaces on its first move
          return true;
        } else if (source[0] - target[0] === -1 && !targetPiece) {
          // Pawn moves forward 1 space
          return true;
        }
      } else if (
        Math.abs(source[1] - target[1]) === 1 &&
        source[0] - target[0] === -1 &&
        !!targetPiece
      ) {
        // Pawn captures diagonally
        return true;
      } else if (
        game.mods.includes(GameTags.WRAP) &&
        source[0] - target[0] === -1 &&
        !!targetPiece &&
        ((source[1] === 0 && target[1] === game.board[source[0]].length) ||
          (source[1] === game.board[source[0]].length && target[1] === 0))
      ) {
        //Pawn captures diagonally over wrap
        return true;
      }
    }
    return false;
  }

  knightMove(source, target, targetPiece, game) {
    if (
      (Math.abs(source[0] - target[0]) === 2 &&
        Math.abs(source[1] - target[1]) === 1) ||
      (Math.abs(source[0] - target[0]) === 1 &&
        Math.abs(source[1] - target[1]) === 2)
    ) {
      // Knight moves in L shape
      return true;
    }
    if (
      (game.mods.includes(GameTags.WRAP) &&
        Math.abs(source[0] - target[0]) === 2 &&
        Math.abs(source[1] - target[1]) === 7) ||
      (game.mods.includes(GameTags.WRAP) &&
        Math.abs(source[0] - target[0]) === 1 &&
        Math.abs(source[1] - target[1]) === 6)
    ) {
      return true;
    }
    return false;
  }

  horizontalMove(source, target, targetPiece, game) {
    if (source[0] === target[0]) {
      const minRow = Math.min(source[1], target[1]);
      const maxRow = Math.max(source[1], target[1]);
      for (let i = minRow + 1; i < maxRow; i++) {
        if (game.board[source[0]][i]) {
          if (game.mods.includes(GameTags.WRAP)) {
            for (let o = maxRow + 1; o != minRow; o++) {
              if (o >= game.board[source[0]].length) {
                o = 0;
                if (minRow == o) {
                  return true;
                }
              }
              if (game.board[source[0]][o]) {
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
    if (source[1] === target[1]) {
      // Rook moves vertically
      const minCol = Math.min(source[0], target[0]);
      const maxCol = Math.max(source[0], target[0]);
      for (let j = minCol + 1; j < maxCol; j++) {
        if (game.board[j][source[1]]) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  diagonalMove(source, target, targetPiece, game) {
    if (Math.abs(source[0] - target[0]) === Math.abs(source[1] - target[1])) {
      // Bishop moves diagonally
      const startRow = source[1];
      const startCol = source[0];
      let colIncrement = 1;
      let rowIncrement = 1;

      if (source[0] > target[0]) {
        colIncrement = -1; // moving from bottom-right to top-left or vice versa
      }

      if (source[1] > target[1]) {
        rowIncrement = -1;
      }
      let canAccessNormal = true;
      for (
        let i = startRow + rowIncrement, j = startCol + colIncrement;
        (rowIncrement > 0 ? i < target[1] : i > target[1]) &&
        (colIncrement > 0 ? j < target[0] : j > target[0]);
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
      game.mods.includes(GameTags.WRAP) &&
      (Math.abs(source[0] - target[0] + 8) ===
        Math.abs(source[1] - target[1]) ||
        Math.abs(source[0] - target[0]) ===
          Math.abs(source[1] - target[1] + 8) ||
        Math.abs(source[0] - target[0] - 8) ===
          Math.abs(source[1] - target[1]) ||
        Math.abs(source[0] - target[0]) === Math.abs(source[1] - target[1] - 8))
    ) {
      if (source[0] < target[0] && source[1] > target[1]) {
        //UR
        for (
          let x = source[0] + 1, y = source[1] + 1;
          x != target[0] && y != target[1];
          x++, y++
        ) {
          if (x >= game.board.length || x < 0) {
            return false;
          }
          if (y >= game.board[source[0]].length) {
            y = 0;
            if (x == target[0] && y == target[1]) {
              return true;
            }
          }
          if (game.board[x][y]) {
            return false;
          }
        }
        return true;
      } else if (source[0] < target[0] && source[1] < target[1]) {
        //UL
        for (
          let x = source[0] + 1, y = source[1] - 1;
          x != target[0] && y != target[1];
          x++, y--
        ) {
          if (x >= game.board.length || x < 0) {
            return false;
          }
          if (y < 0) {
            y = game.board[source[0]].length - 1;
            if (x == target[0] && y == target[1]) {
              return true;
            }
          }
          if (game.board[x][y]) {
            return false;
          }
        }
        return true;
      } else if (source[0] > target[0] && source[1] < target[1]) {
        //DL
        for (
          let x = source[0] - 1, y = source[1] - 1;
          x != target[0] && y != target[1];
          x--, y--
        ) {
          if (x >= game.board.length || x < 0) {
            return false;
          }
          if (y < 0) {
            y = game.board[source[0]].length - 1;
            if (x == target[0] && y == target[1]) {
              return true;
            }
          }
          if (game.board[x][y]) {
            return false;
          }
        }
        return true;
      } else if (source[0] > target[0] && source[1] > target[1]) {
        //DR
        for (
          let x = source[0] - 1, y = source[1] + 1;
          x != target[0] && y != target[1];
          x--, y++
        ) {
          if (x >= game.board.length || x < 0) {
            return false;
          }
          if (y >= game.board[source[0]].length) {
            y = 0;
            if (x == target[0] && y == target[1]) {
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
    if (
      Math.abs(source[0] - target[0]) <= 1 &&
      Math.abs(source[1] - target[1]) <= 1
    ) {
      // King moves 1 space in any direction
      return true;
    } else if (source[1] === target[1] && Math.abs(source[1] === target[1])) {
      // King castles
      if (
        Math.abs(source[0] - target[0]) === 2 &&
        source[1] === target[1] &&
        game.board[source[1]][source[0]] === "K" &&
        game.board[source[1]][7] === "R" &&
        !game.board[source[1]][5] &&
        !game.board[source[1]][6]
      ) {
        return true;
      } else if (
        Math.abs(source[0] - target[0]) === 2 &&
        source[1] === target[1] &&
        game.board[source[1]][source[0]] === "k" &&
        game.board[source[1]][0] === "r" &&
        !board[source[1]][1] &&
        !game.board[source[1]][2] &&
        !game.board[source[1]][3]
      ) {
        return true;
      }
    } else if (game.mods.includes(GameTags.WRAP)) {
      if (
        (Math.abs(source[0] - target[0]) <= 1 &&
          source[1] === 0 &&
          target[1] === game.board[target[0]].length - 1) ||
        (source[1] === game.board[source[1]].length - 1 && target[1] === 0)
      ) {
        return true;
      }
    }
    return false;
  }
}

function algebraicToIndex(algebraic) {
  return [8 - algebraic.charAt(1), algebraic.charCodeAt(0) - 97];
}

function indexToAlgebraic(index) {
  return String.fromCharCode(index[1] + 97) + Math.abs(index[0] - 8);
}

class Chess {
  constructor(fen) {
    const rows = fen.split(" ")[0].split("/");
    this.turn = fen.split(" ")[1];
    this.board = [];
    this.mods = [];
    this.playerColor = "white";

    for (let i = 0; i < rows.length; i++) {
      const row = [];
      let col = 0;

      for (let j = 0; j < rows[i].length; j++) {
        const char = rows[i][j];

        if (isNaN(char)) {
          row.push(piece(char));
        } else {
          for (let o = 0; o < parseInt(char); o++) {
            row.push(null);
          }
        }
      }

      while (row.length < 8) {
        row.push(null);
      }

      this.board.push(row);
    }
  }

  getPieceInfo(square) {
    const index = algebraicToIndex(square);
    const piece = this.board[index[0]][index[1]];
    if (piece) {
      if (this.mods.includes(GameTags.FOG)) {
        let sight = this.moves(this.playerColor).map((move) => {
          return algebraicToIndex(move.to).toString();
        });
        if (
          sight.includes(index?.toString()) ||
          piece.color == this.playerColor
        ) {
          return piece.info(this);
        }
        return null;
      }
      return piece.info(this);
    }
    return null;
  }

  getGameInfo() {
    return `Mods\n${this.mods}`;
  }

  moves(from, playerVisable = false) {
    let moves = [];

    if (from?.length === 2) {
      let sight = this.moves(this.playerColor).map((move) => {
        return algebraicToIndex(move.to).toString();
      });
      const index = algebraicToIndex(from);
      const piece = this.board[index[0]][index[1]];
      if (
        !playerVisable ||
        !this.mods.includes(GameTags.FOG) ||
        sight.includes(index?.toString()) ||
        piece?.color == this.playerColor
      ) {
        for (let x = 0; x < this.board.length; x++) {
          for (let y = 0; y < this.board[x].length; y++) {
            if (this.isLegalMove(from, indexToAlgebraic([x, y]))) {
              moves.push({
                from: from,
                to: indexToAlgebraic([x, y]),
              });
            }
          }
        }
        return moves;
      }
    }

    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        const piece = this.board[i][j];
        if (!!piece && (from === "" || !from || from === piece.color)) {
          for (let x = 0; x < this.board.length; x++) {
            for (let y = 0; y < this.board[x].length; y++) {
              if (
                this.isLegalMove(
                  indexToAlgebraic([i, j]),
                  indexToAlgebraic([x, y])
                )
              ) {
                moves.push({
                  from: indexToAlgebraic([i, j]),
                  to: indexToAlgebraic([x, y]),
                });
              }
            }
          }
        }
      }
    }
    return moves;
  }

  isLegalMove(from, to) {
    const source = algebraicToIndex(from);
    const target = algebraicToIndex(to);
    const piece = this.board[source[0]][source[1]];
    const targetPiece = this.board[target[0]][target[1]];

    if (!piece) {
      return false;
    }

    if (!!targetPiece && piece.color === targetPiece.color) {
      return false;
    }

    return piece.isLegalMove(source, target, targetPiece, this);
  }

  game_over() {
    return false;
  }

  endTurn() {
    this.turn = this.turn == "w" ? "b" : "w";

    const moves = this.moves();
    for (let x = 0; x < this.board.length; x++) {
      for (let y = 0; y < this.board[x].length; y++) {
        this.board[x][y]?.endOfTurn(this, moves);
      }
    }
  }

  fenFow() {
    let fen = "";
    let emptySquares = 0;
    let sight = this.moves(this.playerColor).map((move) => {
      return algebraicToIndex(move.to).toString();
    });

    for (let i = 0; i < this.board.length; i++) {
      if (i !== 0) {
        fen += "/";
      }

      for (let j = 0; j < this.board[i].length; j++) {
        const piece = this.board[i][j];

        if (
          piece &&
          (piece.color === this.playerColor ||
            sight.includes([i, j].toString()))
        ) {
          if (emptySquares) {
            fen += emptySquares;
            emptySquares = 0;
          }

          fen += piece.fen();
        } else {
          emptySquares++;
        }
      }

      if (emptySquares) {
        fen += emptySquares;
        emptySquares = 0;
      }
    }

    return fen;
  }

  fen() {
    if (this.mods.includes(GameTags.FOG)) {
      return this.fenFow();
    }
    let fen = "";
    let emptySquares = 0;

    for (let i = 0; i < this.board.length; i++) {
      if (i !== 0) {
        fen += "/";
      }

      for (let j = 0; j < this.board[i].length; j++) {
        const piece = this.board[i][j];

        if (piece) {
          if (emptySquares) {
            fen += emptySquares;
            emptySquares = 0;
          }

          fen += piece.fen();
        } else {
          emptySquares++;
        }
      }

      if (emptySquares) {
        fen += emptySquares;
        emptySquares = 0;
      }
    }

    return fen;
  }

  move(from, to) {
    const isLegal = this.isLegalMove(from, to);

    if (isLegal) {
      const source = [8 - from.charAt(1), from.charCodeAt(0) - 97];
      const target = [8 - to.charAt(1), to.charCodeAt(0) - 97];
      const targetPiece = this.board[target[0]][target[1]];
      const piece = this.board[source[0]][source[1]];

      if (this.mods.includes(GameTags.SHIELDS) && targetPiece?.hasShield) {
        targetPiece.hasShield = false;
        this.endTurn();
        return true;
      }

      if (this.mods.includes(GameTags.VAMPIRE) && targetPiece) {
        targetPiece.moveTypes.forEach((value) => {
          if (!piece.moveTypes.includes(value)) {
            piece.moveTypes.push(value);
          }
        });
      }

      this.board[source[0]][source[1]] = null;
      this.board[target[0]][target[1]] = piece;
      this.endTurn();
    }
    return isLegal;
  }
}
