const { app, BrowserWindow } = require("electron");
const path = require("path");
//const isDev = require("electron-is-dev");

let mainWindow;

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    minWidth: 1280,
    minHeight: 720,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  mainWindow.setTitle("Chess 2: Game of the Year Edition");
  mainWindow.removeMenu();

  const startUrl = "http://localhost:3000"; // isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "../build/index.html")}`;
  mainWindow.loadURL(startUrl);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
