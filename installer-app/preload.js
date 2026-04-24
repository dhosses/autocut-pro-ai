const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  install: () => ipcRenderer.invoke("install"),
  onProgress: (cb) => ipcRenderer.on("install-progress", (_, data) => cb(data)),
  closeWindow: () => ipcRenderer.send("close-window"),
  minimizeWindow: () => ipcRenderer.send("minimize-window"),
  openPremiere: () => ipcRenderer.send("open-premiere"),
});
