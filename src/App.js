import "./App.css";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import MainMenu from "./menu/mainmenu";
import Game from "./game/game";
import { useState } from "react";
import { CssVarsProvider, extendTheme } from "@mui/joy/styles";

// extend the theme
const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          solidBg: "#bcc567",
          solidHoverBg: "#FFD700",
          solidActiveBg: "#FFA500",
          solidDisabledBg: "#808080",
          solidDisabledColor: "#A9A9A9",
        },
      },
    },
    dark: {
      palette: {
        primary: {
          solidBg: "#bcc567",
          solidHoverBg: "#FFD700",
          solidActiveBg: "#FFA500",
          solidDisabledBg: "#808080",
          solidDisabledColor: "#A9A9A9",
        },
      },
    },
  },
});

function App() {
  const [isMultiplayer, setIsMultiplayer] = useState(false);

  const setMultiplayer = (value) => {
    setIsMultiplayer(value);
  };

  return (
    <CssVarsProvider theme={theme}>
      <Router>
        <Routes>
          <Route exact path="/" element={<MainMenu setMultiplayer={setMultiplayer} />} />
          <Route path="/match" element={<Game multiplayer={isMultiplayer} />} />
        </Routes>
      </Router>
    </CssVarsProvider>
  );
}

export default App;
