import Chess from "./chess2";
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
    props.onDrop(heldPiece, { row: rowIndex, col: squareIndex });
    setHeldPiece(null);
  }

  return (
    <div id="board">
      {Chess().board.map((row, rowIndex) => {
        return (
          <div className="row" key={rowIndex}>
            {row.map((square, squareIndex) => {
              return (
                <div
                  className={`square ${(squareIndex - rowIndex) % 2 === 0 ? "light" : "dark"}`}
                  key={squareIndex}
                  onMouseOver={() => props.onMouseOverSquare(square)}
                  onDrop={(e) => onDragEnd(e, heldPiece, rowIndex, squareIndex)}
                  onDragOver={(e) => e.preventDefault()}>
                  {square ? (
                    <img
                      src={imageMap[`${square.color[0]}${square.fenId.toUpperCase()}`]}
                      alt={`${square.color[0]}${square.fenId.toUpperCase()}.svg`}
                      onDragStart={(e) => onDragStart(e, square)}
                    />
                  ) : (
                    ""
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default Chessboard;
