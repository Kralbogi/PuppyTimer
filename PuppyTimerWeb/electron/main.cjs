const { app, BrowserWindow, session } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 430,
    height: 800,
    minWidth: 375,
    minHeight: 667,
    title: "PuppyTimer",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Konum izni dahil gerekli izinleri otomatik ver
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      const izinVerilenler = ["geolocation", "media", "notifications"];
      callback(izinVerilenler.includes(permission));
    }
  );

  // Menu bar kaldir
  win.setMenuBarVisibility(false);

  // Vite build ciktisini yukle
  win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
