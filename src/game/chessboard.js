import Chess from "./chess2";
import GridPosition from "../models/gridPosition";
import { useState, useEffect } from "react";

const Chessboard = (props) => {
  const imageMap = {
    wP: require("../assets/Pieces/wP.svg").default,
    wR: require("../assets/Pieces/wR.svg").default,
    wN: require("../assets/Pieces/wN.svg").default,
    wB: require("../assets/Pieces/wB.svg").default,
    wQ: require("../assets/Pieces/wQ.svg").default,
    wK: require("../assets/Pieces/wK.svg").default,
    bP: require("../assets/Pieces/bP.svg").default,
    bR: require("../assets/Pieces/bR.svg").default,
    bN: require("../assets/Pieces/bN.svg").default,
    bB: require("../assets/Pieces/bB.svg").default,
    bQ: require("../assets/Pieces/bQ.svg").default,
    bK: require("../assets/Pieces/bK.svg").default,
  };

  const [heldPiece, setHeldPiece] = useState(null);

  function onDragStart(ev, piece) {
    if (props.onDragStart(piece)) {
      setHeldPiece(piece);
    } else {
      ev.preventDefault();
    }
  }

  function onDragEnd(ev, heldPiece, rowIndex, squareIndex) {
    ev.preventDefault();
    props.onDrop(heldPiece, new GridPosition(rowIndex, squareIndex));
    setHeldPiece(null);
  }

  function squareClasses(rowIndex, colIndex) {
    let classes = "square ";
    classes += (colIndex - rowIndex) % 2 === 0 ? "light" : "dark";

    // if the highlighted squares includes an object with the row and col of the current square, add the highlight class
    if (props.highlightedSquares && new GridPosition(rowIndex, colIndex).isIn(props.highlightedSquares)) {
      classes += " highlight";
    }

    if (props.fog && new GridPosition(rowIndex, colIndex).isIn(props.fog)) {
      classes += " fog";
    }
    return classes;
  }

  function isFog(rowIndex, colIndex) {
    if (props.fog && new GridPosition(rowIndex, colIndex).isIn(props.fog)) {
      return true;
    }
    return false;
  }

  function onMouseOverSquare(row, col) {
    var square = new GridPosition(row, col);
    props.onMouseOverSquare(square);
  }

  let board = Chess().board;
  let colOffset = 0;
  let rowOffset = 0;

  if (props.orientation === "black") {
    colOffset = board.length - 1;
    rowOffset = board[0].length - 1; //TODO: support boards with uneven rows
    board = board.reverse();
    board.forEach((row) => {
      row.reverse();
    });
  }

  return (
    <div id="board">
      {board.map((row, rowIndex) => {
        rowIndex = Math.abs(rowOffset - rowIndex);
        return (
          <div className="row" key={rowIndex}>
            {row.map((square, squareIndex) => {
              squareIndex = Math.abs(colOffset - squareIndex);
              return (
                <div
                  className={squareClasses(rowIndex, squareIndex)}
                  key={squareIndex}
                  onMouseOver={() => onMouseOverSquare(rowIndex, squareIndex)}
                  onMouseOut={() => props.onMouseoutSquare(square)}
                  onDrop={(e) => onDragEnd(e, heldPiece, rowIndex, squareIndex)}
                  onDragOver={(e) => e.preventDefault()}>
                  {square && !isFog(rowIndex, squareIndex) ? (
                    <img
                      className="piece"
                      src={imageMap[`${square.color[0]}${square.fenId.toUpperCase()}`]}
                      alt={`${square.color[0]}${square.fenId.toUpperCase()}.svg`}
                      onDragStart={(e) => onDragStart(e, square)}
                    />
                  ) : (
                    ""
                  )}
                  {square && !isFog(rowIndex, squareIndex) ? <PieceStateIndicator piece={square} /> : ""}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

const PieceStateIndicator = (props) => {
  return (
    <div class="piece-state-indicator">
      {Chess().mods.includes("SHIELDS") && props.piece.hasShield && <div className="state-icon">S</div>}
      {Chess().mods.includes("VAMPIRE") && props.piece.isVampire && <div className="state-icon">V</div>}
      {Chess().mods.includes("LOYALTY") && (
        <div className={"number-icon " + (props.piece.loyalty > 50 ? "number-good" : props.piece.loyalty > 9 ? "number-neutral" : "number-bad")}>
          {props.piece.loyalty}
        </div>
      )}
    </div>
  );
};

export default Chessboard;
