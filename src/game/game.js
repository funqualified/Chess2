import Chessboard from "./chessboard";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import React from "react";
import Chess from "./chess2";
import Multiplayer from "./multiplayer";
import getMultiplayer from "./multiplayer";
import ConnectionIndicator from "./connectionIndicator";
import VersionFooter from "../versionFooter";

import { useSound } from "use-sound";
import clickSfx from "../assets/Audio/PressButton.wav";
import matchMusic from "../assets/Audio/MatchMusic.mp3";
import snapbackSfx from "../assets/Audio/SnapbackPiece.mp3";
import pickupPieceSfx from "../assets/Audio/PickupPiece.mp3";
import placePieceSfx from "../assets/Audio/PlacePiece.mp3";
import capturePieceSfx from "../assets/Audio/CapturePiece.mp3";
import shiledUsedSfx from "../assets/Audio/ShieldUsed.mp3";
import turnAlertSfx from "../assets/Audio/TurnAlert.mp3";

const Game = (props) => {
  const navigate = useNavigate();
  const [playClick] = useSound(clickSfx, { volume: 0.25 });
  const [playSnapback] = useSound(snapbackSfx, { volume: 0.25 });
  const [playPickupPiece] = useSound(pickupPieceSfx, { volume: 0.25 });
  const [playPlacePiece] = useSound(placePieceSfx, { volume: 0.25 });
  const [playShieldUsed] = useSound(shiledUsedSfx, { volume: 0.25 });
  const [playCapturePiece] = useSound(capturePieceSfx, { volume: 0.25 });
  const [playTurnAlert] = useSound(turnAlertSfx, { volume: 0.25 });

  const [playMatchMusic, musicObj] = useSound(matchMusic, { volume: 0.02, loop: true, autoplay: true });

  useEffect(() => {
    if (!Chess().initialized) {
      navigate("/");
    } else {
      updateUI();
    }

    if (props.multiplayer) {
      Multiplayer().updateUI = updateUI;
    }
  }, [navigate, props.multiplayer]);

  const [gameInfo, setGameInfo] = useState("");
  const [pieceInfo, setPieceInfo] = useState("");
  const [selectedSquare, setSelectedSquare] = useState("");
  const [moveHighlights, setMoveHighlights] = useState([]);
  const [fogHighlights, setFogHighlights] = useState([]);

  if (!Chess().initialized) {
    return null;
  }

  function onDragStart(piece) {
    // do not pick up pieces if the game is over
    if (Chess().game_over()) return false;
    if (Chess().turn !== Chess().playerColor.charAt(0)) return false;

    // only pick up pieces for player color
    if (piece.color !== Chess().playerColor) return false;

    playPickupPiece();

    return true;
  }

  async function makeAIMove() {
    var possibleMoves = Chess().AIMoves("black");

    // game over
    if (possibleMoves.length === 0) return;

    var randomIdx = Math.floor(Math.random() * possibleMoves.length);

    await Chess().move({ sourceSquare: possibleMoves[randomIdx].from, targetSquare: possibleMoves[randomIdx].to });

    updateUI();
  }

  async function onDrop(piece, target) {
    //create drag object
    var drag = {
      sourceSquare: piece.getIndex(Chess().board),
      targetSquare: target,
    };
    // see if the move is legal
    var move = await Chess().move(drag);

    // illegal move
    if (!move.isLegal) {
      playSnapback();
      return "snapback";
    } else if (props.multiplayer && Multiplayer().peerIsConnected) {
      const data = {
        board: JSON.stringify(Chess().board),
        turn: Chess().turn,
        winner: Chess().winner,
        enPassant: JSON.stringify(Chess().enPassant),
      };
      Multiplayer().conn.send(data);
    }

    // Play sound effect
    if (move.didCapturePiece) {
      playCapturePiece();
    } else if (move.hitShield) {
      playShieldUsed();
    } else {
      playPlacePiece();
    }

    selectSquare(target);

    // make an AI move for black
    if (!props.multiplayer && !Chess().game_over()) {
      window.setTimeout(makeAIMove, 250);
    }

    updateUI();
  }

  function selectSquare(square) {
    if (!square) return;
    const info = Chess().getPieceInfo(square);

    if (info) {
      setPieceInfo(info);
    }

    greySquareMoves(square);
  }

  function onMouseoutSquare(square) {
    removeHightlighSquares();
    setPieceInfo("");
  }

  function greySquareMoves(sqaure) {
    var piece = Chess().board[sqaure.row][sqaure.col];
    if (!piece) return;
    var index = piece.getIndex(Chess().board);
    // get list of possible moves for this square
    var moves = Chess().moves(index, true);

    var squaresToHighlight = [];
    squaresToHighlight.push(index);

    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
      var index = moves[i].to;
      squaresToHighlight.push(index);
    }

    setMoveHighlights(squaresToHighlight);
  }

  function removeHightlighSquares() {
    setMoveHighlights([]);
  }

  function updateUI() {
    setFogHighlights(Chess().fog());
    setGameInfo(Chess().getGameInfo());
    var currentTurn = Chess().turn;
    var playerColor = Chess().playerColor.charAt(0);
    if (currentTurn === playerColor) {
      playTurnAlert();
      console.log("Your turn");
    }
  }

  function quit() {
    if (props.multiplayer) {
      getMultiplayer().disconnect();
      getMultiplayer().closeListing();
    }
    musicObj.stop();
    navigate("/");
  }

  function undo() {
    Chess().undo();
    Chess().undo();
    updateUI();
  }

  return (
    <div id="game-space" className="game">
      {props.multiplayer ? <ConnectionIndicator /> : ""}
      <div className="board">
        <Chessboard
          onMouseOverSquare={selectSquare}
          onMouseoutSquare={onMouseoutSquare}
          onDragStart={onDragStart}
          onDrop={onDrop}
          fog={fogHighlights}
          highlightedSquares={moveHighlights}
          orientation={Chess().playerColor}
        />
      </div>
      <div className="info-container">
        <div id="space-details" className="info-box">
          <p>{pieceInfo}</p>
        </div>
        <div id="game-details" className="info-box">
          <p>{gameInfo}</p>
        </div>
        <button onClick={quit}>Quit Game</button>
        {props.multiplayer ? "" : <button onClick={undo}>Undo</button>}
      </div>
      <VersionFooter />
    </div>
  );
};

export default Game;
