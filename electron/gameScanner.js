import fs from 'fs';
import path from 'path';
import os from 'os';

// Helper to parse Valve VDF/ACF basic format
export function parseAcf(content) {
  const result = {};
  const lines = content.split(/\r?\n/);
  const stack = [result];
  let currentKey = null;

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('//')) continue;

    if (line === '{') {
      if (currentKey) {
        const newObj = {};
        stack[stack.length - 1][currentKey] = newObj;
        stack.push(newObj);
        currentKey = null;
      }
    } else if (line === '}') {
      if (stack.length > 1) {
        stack.pop();
      }
    } else {
      const match = line.match(/^"([^"]+)"\s*(?:"([^"]*)")?$/);
      if (match) {
        const key = match[1];
        const val = match[2];
        if (val !== undefined) {
          stack[stack.length - 1][key] = val;
        } else {
          currentKey = key;
        }
      }
    }
  }
  return result;
}

// Extract library folders from libraryfolders.vdf
export function getSteamLibraryFolders(steamRoot) {
  const folders = [steamRoot];
  const vdfPath = path.join(steamRoot, 'steamapps', 'libraryfolders.vdf');
  if (fs.existsSync(vdfPath)) {
    try {
      const parsed = parseAcf(fs.readFileSync(vdfPath, 'utf8'));
      const libraryFolders = parsed.libraryfolders || parsed;
      for (const key of Object.keys(libraryFolders)) {
        const entry = libraryFolders[key];
        if (entry && typeof entry === 'object' && entry.path) {
          if (!folders.includes(entry.path)) {
            folders.push(entry.path);
          }
        }
      }
    } catch (e) {
      console.warn('Error reading libraryfolders.vdf:', e);
    }
  }

  const drives = ['C:', 'D:', 'E:', 'F:', 'G:'];
  for (const drive of drives) {
    const defaultLib = path.join(drive, 'SteamLibrary');
    if (fs.existsSync(defaultLib) && !folders.includes(defaultLib)) {
      folders.push(defaultLib);
    }
    const defaultSteam = path.join(drive, 'Program Files (x86)', 'Steam');
    if (fs.existsSync(defaultSteam) && !folders.includes(defaultSteam)) {
      folders.push(defaultSteam);
    }
  }

  return folders;
}

// Special curated mappings for Steam game IDs whose covers return 404 or have special releases
const SPECIAL_APP_ARTWORK_MAP = {
  '3405690': '2669320', // EA SPORTS FC 26 -> EA SPORTS FC Official Key Art
  '4001890': '1408610', // How to Fish -> Call of the Wild / Fishing High-Res Art
  '3595230': '1938090', // Call of Duty HQ / Modern Warfare II -> MW2 Official Key Art
  '4224240': '1877020', // Jujutsu Kaisen Phantom Parade -> JJK Official Art
};

// Helper to query Steam store for missing game cover artworks with multi-candidate verification
export async function lookupSteamArtwork(title, originalAppId = null) {
  // Check special manual mapping first
  if (originalAppId && SPECIAL_APP_ARTWORK_MAP[originalAppId]) {
    const targetAppId = SPECIAL_APP_ARTWORK_MAP[originalAppId];
    return {
      coverUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${targetAppId}/library_600x900_2x.jpg`,
      headerUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${targetAppId}/header.jpg`,
      matchedAppId: targetAppId
    };
  }

  const lower = title.toLowerCase();

  // FC / FIFA Matching
  if (lower.includes('fc 26') || lower.includes('fc 25') || lower.includes('fifa') || lower.includes('ea sports fc')) {
    return {
      coverUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2669320/library_600x900_2x.jpg',
      headerUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2669320/header.jpg',
      matchedAppId: '2669320'
    };
  }

  // Fishing Matching
  if (lower.includes('how to fish') || lower.includes('fish')) {
    return {
      coverUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1408610/library_600x900_2x.jpg',
      headerUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1408610/header.jpg',
      matchedAppId: '1408610'
    };
  }

  // Modern Warfare / COD
  if (lower.includes('modern warfare') || (lower.includes('call of duty') && lower.includes('warfare'))) {
    return {
      coverUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1938090/library_600x900_2x.jpg',
      headerUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1938090/header.jpg',
      matchedAppId: '1938090'
    };
  }

  // Jujutsu Kaisen
  if (lower.includes('jujutsu kaisen') || lower.includes('phantom parade')) {
    return {
      coverUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1877020/library_600x900_2x.jpg',
      headerUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1877020/header.jpg',
      matchedAppId: '1877020'
    };
  }

  try {
    const cleanQuery = title
      .replace(/™|®|©/g, '')
      .replace(/Enhanced|Legacy|Special Edition/gi, '')
      .trim();

    const res = await fetch(`https://store.steampowered.com/search/suggest?term=${encodeURIComponent(cleanQuery)}&f=games&cc=US&l=english`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await res.text();
    const matches = [...html.matchAll(/data-ds-appid="(\d+)"/g)];

    for (const match of matches.slice(0, 4)) {
      const candidateAppId = match[1];
      const testUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${candidateAppId}/library_600x900_2x.jpg`;
      try {
        const headRes = await fetch(testUrl, { method: 'HEAD' });
        if (headRes.status === 200) {
          return {
            coverUrl: testUrl,
            headerUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${candidateAppId}/header.jpg`,
            matchedAppId: candidateAppId
          };
        }
      } catch (e) {}
    }
  } catch (err) {
    // ignore
  }
  return null;
}

// Scan Steam Games
export function scanSteamGames() {
  const games = [];
  const knownRoots = [
    'C:/Program Files (x86)/Steam',
    'C:/Program Files/Steam',
    'D:/Steam',
    'E:/Steam'
  ];
  const validRoots = knownRoots.filter(fs.existsSync);
  const allLibraries = new Set();

  for (const root of validRoots) {
    getSteamLibraryFolders(root).forEach(lib => allLibraries.add(lib));
  }
  ['C:/SteamLibrary', 'D:/SteamLibrary', 'E:/SteamLibrary'].forEach(lib => {
    if (fs.existsSync(lib)) allLibraries.add(lib);
  });

  const processedAppIds = new Set();

  for (const lib of allLibraries) {
    const steamApps = path.join(lib, 'steamapps');
    if (!fs.existsSync(steamApps)) continue;

    try {
      const files = fs.readdirSync(steamApps);
      for (const file of files) {
        if (file.startsWith('appmanifest_') && file.endsWith('.acf')) {
          try {
            const content = fs.readFileSync(path.join(steamApps, file), 'utf8');
            const data = parseAcf(content).AppState || {};
            const appId = data.appid;
            const name = data.name;
            const installDirName = data.installdir;

            if (!appId || !name || processedAppIds.has(appId)) continue;
            if (name.includes('Steamworks Common') || name.includes('Steam Linux') || name.includes('Proton')) continue;

            processedAppIds.add(appId);
            const fullInstallPath = path.join(steamApps, 'common', installDirName || '');

            games.push({
              id: `steam-${appId}`,
              appId: appId,
              title: name,
              platform: 'Steam',
              launchUrl: `steam://rungameid/${appId}`,
              installPath: fs.existsSync(fullInstallPath) ? fullInstallPath : null,
              coverUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900_2x.jpg`,
              headerUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
              iconUrl: `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/${appId}/logo.jpg`,
              isFavorite: false,
              shelfCategory: 'Steam',
              sizeBytes: Number(data.SizeOnDisk || 0),
              lastPlayed: data.LastPlayed ? Number(data.LastPlayed) : 0
            });
          } catch (e) {
            console.error('Error parsing manifest:', file, e);
          }
        }
      }
    } catch (e) {
      console.warn('Could not read steamapps directory:', steamApps, e);
    }
  }

  return games;
}

// Scan Epic Games Launcher manifests
export function scanEpicGames() {
  const games = [];
  const epicManifestDir = 'C:/ProgramData/Epic/EpicGamesLauncher/Data/Manifests';
  if (!fs.existsSync(epicManifestDir)) return games;

  try {
    const files = fs.readdirSync(epicManifestDir);
    for (const file of files) {
      if (file.endsWith('.item')) {
        try {
          const content = fs.readFileSync(path.join(epicManifestDir, file), 'utf8');
          const data = JSON.parse(content);
          if (data.DisplayName && data.AppName) {
            const catalogPart = data.CatalogNamespace && data.CatalogItemId
              ? `${data.CatalogNamespace}%3A${data.CatalogItemId}%3A${data.AppName}`
              : data.AppName;
            
            const launchUrl = `com.epicgames.launcher://apps/${catalogPart}?action=launch&silent=true`;

            games.push({
              id: `epic-${data.AppName}`,
              appId: data.AppName,
              title: data.DisplayName,
              platform: 'Epic Games',
              launchUrl: launchUrl,
              installPath: data.InstallLocation || null,
              coverUrl: null,
              headerUrl: null,
              isFavorite: false,
              shelfCategory: 'Epic Games',
              sizeBytes: Number(data.InstallSize || 0),
              lastPlayed: 0
            });
          }
        } catch (e) {
          console.error('Error reading Epic manifest item:', file, e);
        }
      }
    }
  } catch (e) {
    console.warn('Error accessing Epic manifests:', e);
  }

  return games;
}

// Scan Xbox / Microsoft Store PC Games
export function scanXboxGames() {
  const games = [];
  const drives = ['C:', 'D:', 'E:', 'F:'];
  for (const drive of drives) {
    const xboxDir = path.join(drive, 'XboxGames');
    if (fs.existsSync(xboxDir)) {
      try {
        const items = fs.readdirSync(xboxDir);
        for (const item of items) {
          if (item === 'GameSave' || item.startsWith('.')) continue;
          const fullPath = path.join(xboxDir, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            games.push({
              id: `xbox-${item.replace(/\s+/g, '-').toLowerCase()}`,
              appId: item,
              title: item,
              platform: 'Xbox',
              launchUrl: fullPath,
              installPath: fullPath,
              coverUrl: null,
              headerUrl: null,
              isFavorite: false,
              shelfCategory: 'Xbox',
              sizeBytes: 0,
              lastPlayed: 0
            });
          }
        }
      } catch (e) {
        console.warn('Error reading XboxGames:', xboxDir, e);
      }
    }
  }
  return games;
}

// Scan Desktop and Shortcuts (.url and .lnk)
export function scanDesktopAndShortcuts() {
  const games = [];
  const desktopDirs = [
    path.join(os.homedir(), 'Desktop'),
    'C:/Users/Public/Desktop'
  ];

  for (const dir of desktopDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (file.endsWith('.url')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const urlMatch = content.match(/URL=(.+)/i);
            const iconMatch = content.match(/IconFile=(.+)/i);
            const url = urlMatch ? urlMatch[1].trim() : '';
            const title = path.basename(file, '.url');

            const lowerTitle = title.toLowerCase();
            const ignoredWords = ['chrome', 'brave', 'edge', 'studio', 'afterburner', 'sentinel', 'download manager', 'idm', 'antigravity', 'github', 'drive', 'rider', 'vscode'];
            if (ignoredWords.some(w => lowerTitle.includes(w))) continue;

            let platform = 'Masaüstü';
            if (url.startsWith('steam://')) platform = 'Steam';
            else if (url.startsWith('com.epicgames.')) platform = 'Epic Games';

            if (url) {
              games.push({
                id: `url-${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
                appId: title,
                title: title,
                platform: platform,
                launchUrl: url,
                iconFile: iconMatch ? iconMatch[1].trim() : null,
                coverUrl: null,
                isFavorite: false,
                shelfCategory: platform,
                sizeBytes: 0,
                lastPlayed: 0
              });
            }
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (e) {
      console.warn('Error reading desktop:', dir, e);
    }
  }

  return games;
}

// Master scanner with automatic Steam cover art verification & fallback
export async function scanAllInstalledGames() {
  const steamGames = scanSteamGames();
  const epicGames = scanEpicGames();
  const xboxGames = scanXboxGames();
  const shortcutGames = scanDesktopAndShortcuts();

  const cleanTitle = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
  const existingMap = new Map();

  for (const g of steamGames) {
    existingMap.set(cleanTitle(g.title), g);
  }
  for (const g of epicGames) {
    const key = cleanTitle(g.title);
    if (!existingMap.has(key)) existingMap.set(key, g);
  }
  for (const g of xboxGames) {
    const key = cleanTitle(g.title);
    if (!existingMap.has(key)) existingMap.set(key, g);
  }
  for (const g of shortcutGames) {
    const key = cleanTitle(g.title);
    if (!existingMap.has(key)) existingMap.set(key, g);
  }

  const allGames = Array.from(existingMap.values());

  // Automatic Artwork Verification and Resolution
  for (const game of allGames) {
    let needsArtwork = !game.coverUrl;

    if (game.coverUrl) {
      try {
        const check = await fetch(game.coverUrl, { method: 'HEAD' });
        if (check.status !== 200) {
          needsArtwork = true;
        }
      } catch (e) {
        needsArtwork = true;
      }
    }

    if (needsArtwork) {
      const art = await lookupSteamArtwork(game.title, game.appId);
      if (art) {
        game.coverUrl = art.coverUrl;
        game.headerUrl = art.headerUrl;
      }
    }
  }

  return allGames;
}
