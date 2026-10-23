import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { scanAllInstalledGames, lookupSteamArtwork } from './gameScanner.js';

// CRITICAL: Set the App Name FIRST before ANY other app call.
app.name = 'PhysicalGameShelf';

// Provide clean isolated User Data directory for this app
const appDataDir = app.getPath('appData');
const dedicatedUserData = path.join(appDataDir, 'PhysicalGameShelf');
if (!fs.existsSync(dedicatedUserData)) {
  fs.mkdirSync(dedicatedUserData, { recursive: true });
}
app.setPath('userData', dedicatedUserData);

// Clean up stale locked caches on launch
try {
  const stale1 = path.join(dedicatedUserData, 'GPUPersistentCache');
  if (fs.existsSync(stale1)) fs.rmSync(stale1, { recursive: true, force: true });
  const stale2 = path.join(appDataDir, 'Electron', 'GPUPersistentCache');
  if (fs.existsSync(stale2)) fs.rmSync(stale2, { recursive: true, force: true });
} catch (e) {}

// Disable Chromium Graphite and Dawn persistent disk caching to eliminate (0x20) lock errors
app.commandLine.appendSwitch('disable-features', 'Graphite,EnablePersistentShaderCache,DawnGraphiteCache');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-gpu-program-cache');
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('log-level', '3'); // silence non-fatal warnings

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  const iconPath = path.join(__dirname, '../src/icon.jpg');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1000,
    minHeight: 700,
    title: 'Physical Game Shelf - Nostalgic Bookshelf Edition',
    icon: iconPath,
    backgroundColor: '#1b120c',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#2a1a11',
      symbolColor: '#f1d6b8',
      height: 38
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
  });

  const distIndex = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(distIndex) && process.env.NODE_ENV !== 'dev-force') {
    mainWindow.loadFile(distIndex);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Parse a dropped file path (from desktop shortcut or exe)
ipcMain.handle('parse-dropped-game-file', async (event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) return null;

    const ext = path.extname(filePath).toLowerCase();
    const rawTitle = path.basename(filePath, path.extname(filePath));
    let launchUrl = filePath;
    let installPath = filePath;
    let platform = 'Özel Oyun';

    if (ext === '.url') {
      const content = fs.readFileSync(filePath, 'utf8');
      const urlMatch = content.match(/URL=(.+)/i);
      if (urlMatch) {
        launchUrl = urlMatch[1].trim();
        if (launchUrl.startsWith('steam://')) platform = 'Steam';
        else if (launchUrl.startsWith('com.epicgames.')) platform = 'Epic Games';
      }
    }

    const art = await lookupSteamArtwork(rawTitle);

    return {
      id: `dropped-${Date.now()}`,
      title: rawTitle,
      platform: platform,
      launchUrl: launchUrl,
      installPath: installPath,
      coverUrl: art ? art.coverUrl : null,
      headerUrl: art ? art.headerUrl : null,
      isFavorite: false,
      sizeBytes: 0,
    };
  } catch (err) {
    console.error('Error parsing dropped file:', err);
    return null;
  }
});

// IPC Handlers
ipcMain.handle('scan-games', async () => {
  try {
    return await scanAllInstalledGames();
  } catch (err) {
    console.error('Scan failed:', err);
    return [];
  }
});

ipcMain.handle('launch-game', async (event, game) => {
  try {
    if (game.launchUrl) {
      if (game.launchUrl.startsWith('steam://') || game.launchUrl.startsWith('com.epicgames.') || game.launchUrl.startsWith('http')) {
        await shell.openExternal(game.launchUrl);
        return { success: true };
      } else {
        await shell.openPath(game.launchUrl);
        return { success: true };
      }
    } else if (game.installPath) {
      await shell.openPath(game.installPath);
      return { success: true };
    }
    return { success: false, message: 'Çalıştırılabilir dosya yolu bulunamadı.' };
  } catch (err) {
    console.error('Error launching game:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-game-folder', async (event, folderPath) => {
  if (folderPath && fs.existsSync(folderPath)) {
    shell.openPath(folderPath);
    return true;
  }
  return false;
});

ipcMain.handle('select-custom-executable', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Özel Oyun veya Başlatıcı Seç (.exe, .lnk, .url)',
    properties: ['openFile'],
    filters: [
      { name: 'Çalıştırılabilir Dosyalar', extensions: ['exe', 'lnk', 'url', 'bat'] }
    ]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const fileName = path.basename(filePath, path.extname(filePath));
    const art = await lookupSteamArtwork(fileName);

    return {
      filePath,
      fileName,
      coverUrl: art ? art.coverUrl : null,
      headerUrl: art ? art.headerUrl : null,
    };
  }
  return null;
});

ipcMain.handle('select-custom-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Özel Kapak Görseli Seç',
    properties: ['openFile'],
    filters: [
      { name: 'Görseller', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }
    ]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});
