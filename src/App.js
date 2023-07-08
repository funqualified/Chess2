import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainMenu from "./menu/mainmenu";
import Game from "./game/game";
import { useState } from "react";

function App() {
  const [isMultiplayer, setIsMultiplayer] = useState(false);

  const setMultiplayer = (value) => {
    setIsMultiplayer(value);
  };

  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<MainMenu setMultiplayer={setMultiplayer} />} />
        <Route path="/match" element={<Game multiplayer={isMultiplayer} />} />
      </Routes>
    </Router>
  );
}

export default App;
