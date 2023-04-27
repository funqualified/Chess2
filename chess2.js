const GameTags = {
    FOG:"You can only see spaces your pieces can move to",
    STAMINA:"Each piece needs stamina to move",
    VAMPIRE:"Pieces gain the powers of pieces they've captured",
    SHIELDS:"Pieces can have a shield that prevents capture, consumed on use",
    WRAP:"The left and right sides of the board wrap around",
    LOYALTY:"Pieces may defect to the other side",
    HITCHANCE:"Pieces may fail to capture",
    BOMBERS:"Pieces explode after X moves, capturing themselves and adjecent spaces",
    RELOAD:"Pawn promotion requires a quicktime minigame",
}

function piece(fenId) {
    const color = (fenId >= 'A' && fenId <= 'Z') ? "white" : "black";
    switch(fenId.toLowerCase()){
        case 'p':
            return new Pawn(color);
        case 'b':
            return new Bishop(color);
        case 'n':
            return new Knight(color);
        case 'r':
            return new Rook(color);
        case 'q':
            return new Queen(color);
        case 'k':
            return new King(color);
        default:
            console.log("Unrecognized piece");
            return new Piece(color, fenId);
    }
}

class Piece {
    constructor(color, fenId){
        this.color = color;
        this.fenId = fenId;
    }
    fen() {
        return this.color === "white" ? this.fenId.toUpperCase() : this.fenId.toLowerCase();
    }
    isLegalMove(source, target, board){
        return false;
    }
}

class Pawn extends Piece {
    constructor(color){
        super(color, 'p');
    }
    isLegalMove(source, target, targetPiece, board){
        if(this.color == "white"){
            if (source[1] === target[1]) {
              if (source[0] - target[0] === 2 && source[0] === 6 && !targetPiece && !board[source[0]-1][source[1]]) {
                // Pawn moves 2 spaces on its first move
                return true;
              } else if (source[0] - target[0] === 1 && !targetPiece) {
                // Pawn moves forward 1 space
                return true;
              }
            } else if (Math.abs(source[1] - target[1]) === 1 && source[0] - target[0] === 1 && !!targetPiece) {
              // Pawn captures diagonally
              return true;
            }
        }else{
          if (source[1] === target[1]) {
              if (source[0] - target[0] === -2 && source[0] === 1 && !targetPiece && !board[source[0]+1][source[1]]) {
                // Pawn moves 2 spaces on its first move
                return true;
              } else if (source[0] - target[0] === -1 && !targetPiece) {
                // Pawn moves forward 1 space
                return true;
              }
            } else if (Math.abs(source[1] - target[1]) === 1 && source[0] - target[0] === -1 && !!targetPiece) {
              // Pawn captures diagonally
              return true;
            }
        }
        return false;
    }
}

class Rook extends Piece {
    constructor(color){
        super(color, 'r');
    }
    isLegalMove(source, target, targetPiece, board){
        if (source[0] === target[0]) {
            // Rook moves vertically
            const minRow = Math.min(source[1], target[1]);
            const maxRow = Math.max(source[1], target[1]);
            for (let i = minRow + 1; i < maxRow; i++) {
              if (board[source[0]][i]) {
                return false;
              }
            }
            return true;
          } else if (source[1] === target[1]) {
            // Rook moves horizontally
            const minCol = Math.min(source[0], target[0]);
            const maxCol = Math.max(source[0], target[0]);
            for (let j = minCol + 1; j < maxCol; j++) {
              if (board[j][source[1]]) {
                return false;
              }
            }
            return true;
          }
          return false;
    }
}

class Knight extends Piece {
    constructor(color){
        super(color, 'n');
    }
    isLegalMove(source, target, targetPiece, board){
        if ((Math.abs(source[0] - target[0]) === 2 && Math.abs(source[1] - target[1]) === 1) ||
                  (Math.abs(source[0] - target[0]) === 1 && Math.abs(source[1] - target[1]) === 2)) {
                // Knight moves in L shape
                return true;
              }
        return false;
    }
}

class Bishop extends Piece {
    constructor(color){
        super(color, 'b');
    }
    isLegalMove(source, target, targetPiece, board){
        if (Math.abs(source[0] - target[0]) === Math.abs(source[1] - target[1])) {
            // Bishop moves diagonally
            const startRow = source[1];
            const startCol = source[0];
            let colIncrement = 1;
            let rowIncrement = 1;
        
            if (source[0] > target[0]) {
              colIncrement = -1; // moving from bottom-right to top-left or vice versa
            }

            if(source[1] > target[1]){
                rowIncrement = -1;
            }

            for (let i = startRow + rowIncrement, j = startCol + colIncrement;
                (rowIncrement > 0 ? i < target[1] : i > target[1]) && 
                (colIncrement > 0 ? j < target[0] : j > target[0]);
                i+=rowIncrement, j+=colIncrement) {
              if (board[j][i]) {
                return false;
              }
            }
            return true;
          }
        return false;
    }
}

class Queen extends Piece {
    constructor(color){
        super(color, 'q');
    }
    isLegalMove(source, target, targetPiece, board){
        if (source[0] === target[0]) {
            // Queen moves vertically
            const minRow = Math.min(source[1], target[1]);
            const maxRow = Math.max(source[1], target[1]);
            for (let i = minRow + 1; i < maxRow; i++) {
                if (board[source[0]][i]) {
                return false;
                }
            }
            return true;
          } else if (source[1] === target[1]) {
            // Queen moves horizontally
            const minCol = Math.min(source[0], target[0]);
            const maxCol = Math.max(source[0], target[0]);
            for (let j = minCol + 1; j < maxCol; j++) {
                if (board[j][source[1]]) {
                return false;
                }
            }
            return true;
          } else if (Math.abs(source[0] - target[0]) === Math.abs(source[1] - target[1])) {
            // Queen moves diagonally
            const startRow = source[1];
            const startCol = source[0];
            let colIncrement = 1;
            let rowIncrement = 1;
        
            if (source[0] > target[0]) {
              colIncrement = -1; // moving from bottom-right to top-left or vice versa
            }

            if(source[1] > target[1]){
                rowIncrement = -1;
            }

            for (let i = startRow + rowIncrement, j = startCol + colIncrement;
                (rowIncrement > 0 ? i < target[1] : i > target[1]) && 
                (colIncrement > 0 ? j < target[0] : j > target[0]);
                i+=rowIncrement, j+=colIncrement) {
              if (board[j][i]) {
                return false;
              }
            }
            return true;
          }
        return false;
    }
}

class King extends Piece {
    constructor(color){
        super(color, 'k');
    }
    isLegalMove(source, target, targetPiece, board){
        if (Math.abs(source[0] - target[0]) <= 1 && Math.abs(source[1] - target[1]) <= 1) {
            // King moves 1 space in any direction
            return true;
          } else if (source[1] === target[1] && Math.abs(source[1] === target[1])){
            // King castles
            if (Math.abs(source[0] - target[0]) === 2 && source[1] === target[1] && board[source[1]][source[0]] === 'K' && board[source[1]][7] === 'R' && !board[source[1]][5] && !board[source[1]][6]) {
                return true;
            } else if (Math.abs(source[0] - target[0]) === 2 && source[1] === target[1] && board[source[1]][source[0]] === 'k' && board[source[1]][0] === 'r' && !board[source[1]][1] && !board[source[1]][2] && !board[source[1]][3]) {
                return true;
            }
        }
        return false;
    }
}

function algebraicToIndex(algebraic){
    return [8 - algebraic.charAt(1), algebraic.charCodeAt(0) - 97]
}

function indexToAlgebraic(index){
    return String.fromCharCode(index[1]+97) + Math.abs(index[0] - 8);
}

class Chess {
    constructor(fen){
        const rows = fen.split(' ')[0].split('/');
        this.turn = fen.split(' ')[1];
        this.board = [];
        this.mods = [];
      
        for (let i = 0; i < rows.length; i++) {
          const row = [];
          let col = 0;
      
          for (let j = 0; j < rows[i].length; j++) {
            const char = rows[i][j];
      
            if (isNaN(char)) {
              row.push(piece(char));
              col++;
            } else {
              col += parseInt(char);
            }
          }
      
          while (row.length < 8) {
            row.push(null);
          }
      
          this.board.push(row);
        }
    }

    moves(color){
        let moves = [];
        for (let i = 0; i < this.board.length; i++) {    
            for (let j = 0; j < this.board[i].length; j++) {
              const piece = this.board[i][j];
                
              if (!!piece && (color === "any" || color === piece.color)) {
                for(let x = 0; x < this.board.length; x++){
                    for(let y = 0; y < this.board[x].length; y++){
                        if(this.isLegalMove(indexToAlgebraic([i,j]),indexToAlgebraic([x,y]))){
                            moves.push({from:indexToAlgebraic([i,j]),to:indexToAlgebraic([x,y])});
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

        if(!!targetPiece && piece.color === targetPiece.color){
            return false;
        }
    
        return piece.isLegalMove(source,target,targetPiece,this.board);
    }

    game_over(){
        return false;
    }

    fenFow(){
        let fen = '';
        let emptySquares = 0;
        let sight = this.moves("white").map((move) =>{
            return algebraicToIndex(move.to).toString();
        });
    
        for (let i = 0; i < this.board.length; i++) {
          if (i !== 0) {
            fen += '/';
          }
    
          for (let j = 0; j < this.board[i].length; j++) {
            const piece = this.board[i][j];
            
            if (piece && (piece.color === "white" || sight.includes([i,j].toString()))) {
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
        if(this.mods.includes(GameTags.FOG)){return this.fenFow()}
        let fen = '';
        let emptySquares = 0;
    
        for (let i = 0; i < this.board.length; i++) {
          if (i !== 0) {
            fen += '/';
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
        if(isLegal){
            const source = [8-from.charAt(1), from.charCodeAt(0) - 97]
            const target = [8-to.charAt(1), to.charCodeAt(0) - 97]
            const piece = this.board[source[0]][source[1]];
            this.board[source[0]][source[1]] = null;
            this.board[target[0]][target[1]] = piece;
            this.turn = this.turn == 'w' ? 'b' : 'w';
        }
        return isLegal;
    }
}
 