const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  scanGames: () => ipcRenderer.invoke('scan-games'),
  launchGame: (game) => ipcRenderer.invoke('launch-game', game),
  openGameFolder: (folderPath) => ipcRenderer.invoke('open-game-folder', folderPath),
  selectCustomExecutable: () => ipcRenderer.invoke('select-custom-executable'),
  selectCustomImage: () => ipcRenderer.invoke('select-custom-image'),
  parseDroppedGameFile: (filePath) => ipcRenderer.invoke('parse-dropped-game-file', filePath),
});
