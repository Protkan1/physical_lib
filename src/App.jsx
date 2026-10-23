import React, { useState, useEffect } from 'react';
import ShelfRow from './components/ShelfRow';
import GameModal from './components/GameModal';
import {
  RotateCw,
  Plus,
  Search,
  Layers,
  Gamepad2,
  FolderPlus,
  Sparkles,
  Volume2,
  VolumeX,
  ScanBarcode,
  SlidersHorizontal,
  Flame,
  Palette,
  ArrowDownAZ
} from 'lucide-react';
import confetti from 'canvas-confetti';
import appIcon from './icon.jpg';
import { soundFX } from './utils/soundFX';

const STORAGE_KEY = 'physical_lib_shelves_state_v5';

export default function App() {
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlatformFilter, setActivePlatformFilter] = useState('ALL');
  const [selectedGame, setSelectedGame] = useState(null);
  const [isAddingShelf, setIsAddingShelf] = useState(false);
  const [newShelfTitle, setNewShelfTitle] = useState('');

  // 7 Big Features States
  const [woodTheme, setWoodTheme] = useState(() => localStorage.getItem('shelf_wood_theme') || 'walnut');
  const [atmosphere, setAtmosphere] = useState(() => localStorage.getItem('shelf_atmosphere') || 'none');
  const [isMuted, setIsMuted] = useState(false);
  const [isBarcodeScanning, setIsBarcodeScanning] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // Drag and drop state
  const [draggedInfo, setDraggedInfo] = useState(null);
  const [isDraggingExternalFile, setIsDraggingExternalFile] = useState(false);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    setLoading(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          setShelves(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Failed to parse saved shelves:', e);
      }
    }

    await handleFullScan();
  };

  const handleFullScan = async () => {
    setLoading(true);
    try {
      let games = [];
      if (window.electronAPI && window.electronAPI.scanGames) {
        games = await window.electronAPI.scanGames();
      }

      // Group games logically: Favorites, Steam shelves, Epic Games shelf, and Others
      const favorites = games.slice(0, 6).map(g => ({ ...g, isFavorite: true }));
      const steamGames = games.filter(g => g.platform === 'Steam');
      const epicGames = games.filter(g => g.platform === 'Epic Games');
      const otherGames = games.filter(g => g.platform !== 'Steam' && g.platform !== 'Epic Games');

      // Chunk Steam games so shelves look balanced
      const chunkSize = 8;
      const steamChunks = [];
      for (let i = 0; i < steamGames.length; i += chunkSize) {
        steamChunks.push(steamGames.slice(i, i + chunkSize));
      }

      const initialShelves = [
        {
          id: 'shelf-favs',
          title: '⭐ Öne Çıkanlar & Favoriler',
          games: favorites
        },
        // Dedicated Epic Games shelf
        ...(epicGames.length > 0 ? [{
          id: 'shelf-epic',
          title: '⚡ Epic Games Kütüphanesi',
          games: epicGames
        }] : []),
        // Steam shelves
        ...steamChunks.map((chunk, idx) => ({
          id: `shelf-steam-${idx + 1}`,
          title: `🎮 Steam Koleksiyonu (Raf ${idx + 1})`,
          games: chunk
        })),
        // Other / Xbox shelf
        ...(otherGames.length > 0 ? [{
          id: 'shelf-others',
          title: '📦 Xbox & Masaüstü Oyunları',
          games: otherGames
        }] : [])
      ].filter(s => s.games.length > 0);

      setShelves(initialShelves);
      saveShelvesState(initialShelves);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#e5b364', '#fbe3a1', '#8c6020']
      });
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveShelvesState = (updatedShelves) => {
    setShelves(updatedShelves);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedShelves));
  };

  // Launch Game
  const handleLaunch = async (game) => {
    if (window.electronAPI && window.electronAPI.launchGame) {
      const res = await window.electronAPI.launchGame(game);
      if (!res.success && res.message) {
        alert(res.message);
      }
    } else {
      window.open(game.launchUrl, '_blank');
    }
  };

  const handleOpenFolder = (folderPath) => {
    if (window.electronAPI && window.electronAPI.openGameFolder) {
      window.electronAPI.openGameFolder(folderPath);
    }
  };

  const handleToggleFavorite = (gameId) => {
    const updated = shelves.map(shelf => ({
      ...shelf,
      games: shelf.games.map(g => {
        if (g.id === gameId) {
          return { ...g, isFavorite: !g.isFavorite };
        }
        return g;
      })
    }));
    saveShelvesState(updated);
  };

  const handleChangeCover = async (gameId) => {
    if (window.electronAPI && window.electronAPI.selectCustomImage) {
      const newImagePath = await window.electronAPI.selectCustomImage();
      if (newImagePath) {
        const safeUrl = `file:///${newImagePath.replace(/\\/g, '/')}`;
        const updated = shelves.map(shelf => ({
          ...shelf,
          games: shelf.games.map(g => {
            if (g.id === gameId) {
              return { ...g, coverUrl: safeUrl };
            }
            return g;
          })
        }));
        saveShelvesState(updated);
        if (selectedGame && selectedGame.id === gameId) {
          setSelectedGame({ ...selectedGame, coverUrl: safeUrl });
        }
      }
    }
  };

  const handleAddCustomGame = async () => {
    if (window.electronAPI && window.electronAPI.selectCustomExecutable) {
      const item = await window.electronAPI.selectCustomExecutable();
      if (item) {
        const newGame = {
          id: `custom-${Date.now()}`,
          title: item.fileName,
          platform: 'Özel Oyun',
          launchUrl: item.filePath,
          installPath: item.filePath,
          coverUrl: item.coverUrl || null,
          headerUrl: item.headerUrl || null,
          isFavorite: false,
          sizeBytes: 0,
        };

        const updated = [...shelves];
        if (updated.length > 0) {
          updated[0].games.unshift(newGame);
        } else {
          updated.push({
            id: `shelf-${Date.now()}`,
            title: 'Yeni Raf',
            games: [newGame]
          });
        }
        saveShelvesState(updated);
      }
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFX.setMuted(next);
    if (!next) {
      soundFX.playBarcodeBeep();
    }
  };

  const handleSelectWoodTheme = (t) => {
    setWoodTheme(t);
    localStorage.setItem('shelf_wood_theme', t);
    soundFX.playWoodSlide();
  };

  const handleSelectAtmosphere = (a) => {
    setAtmosphere(a);
    localStorage.setItem('shelf_atmosphere', a);
    soundFX.playWoodSlide();
  };

  // Laser Barcode Scanner simulation: Sweeps laser line, beeps, and jumps to a random game or opens it
  const handleTriggerBarcodeScanner = () => {
    soundFX.playBarcodeBeep();
    setIsBarcodeScanning(true);
    setTimeout(() => {
      setIsBarcodeScanning(false);
      // Pick a random game from existing shelves to inspect
      const allGames = shelves.flatMap(s => s.games);
      if (allGames.length > 0) {
        const picked = allGames[Math.floor(Math.random() * allGames.length)];
        soundFX.playCaseOpen();
        setSelectedGame(picked);
      }
    }, 1400);
  };

  // Smart Sorting A-Z across shelves
  const handleSortShelvesAlphabetical = () => {
    soundFX.playWoodSlide();
    const sorted = shelves.map(shelf => ({
      ...shelf,
      games: [...shelf.games].sort((a, b) => a.title.localeCompare(b.title))
    }));
    saveShelvesState(sorted);
    setIsSortMenuOpen(false);
  };

  // Smart Sorting: Group by Platform
  const handleSortByPlatform = () => {
    soundFX.playWoodSlide();
    const allGames = shelves.flatMap(s => s.games);
    const steamGames = allGames.filter(g => g.platform === 'Steam');
    const epicGames = allGames.filter(g => g.platform === 'Epic Games');
    const xboxGames = allGames.filter(g => g.platform === 'Xbox');
    const otherGames = allGames.filter(g => !['Steam', 'Epic Games', 'Xbox'].includes(g.platform));

    const chunk = (arr, size) => {
      const res = [];
      for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
      return res;
    };

    const reOrganized = [
      ...chunk(steamGames, 8).map((grp, idx) => ({
        id: `shelf-sorted-steam-${idx + 1}`,
        title: `🎮 Steam Arşivi (Bölüm ${idx + 1})`,
        games: grp
      })),
      ...(epicGames.length > 0 ? [{
        id: 'shelf-sorted-epic',
        title: '⚡ Epic Games Koleksiyonu',
        games: epicGames
      }] : []),
      ...(xboxGames.length > 0 ? [{
        id: 'shelf-sorted-xbox',
        title: '🟢 Xbox & Konsol Koleksiyonu',
        games: xboxGames
      }] : []),
      ...(otherGames.length > 0 ? [{
        id: 'shelf-sorted-other',
        title: '📦 Özel & Masaüstü Oyunları',
        games: otherGames
      }] : [])
    ].filter(s => s.games.length > 0);

    saveShelvesState(reOrganized);
    setIsSortMenuOpen(false);
  };

  const handleAddShelf = () => {
    if (!newShelfTitle.trim()) return;
    const newShelf = {
      id: `shelf-${Date.now()}`,
      title: newShelfTitle.trim(),
      games: []
    };
    const updated = [...shelves, newShelf];
    saveShelvesState(updated);
    setNewShelfTitle('');
    setIsAddingShelf(false);
  };

  // Internal shelf drag start
  const handleDragStart = (e, game, fromShelfId, fromGameId) => {
    setDraggedInfo({ game, fromShelfId, fromGameId });
    setIsDraggingExternalFile(false);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', JSON.stringify({ fromShelfId, fromGameId }));
      e.dataTransfer.setData('application/x-physical-game', game.id);
    } catch (err) {}
  };

  const handleDragEnd = () => {
    setDraggedInfo(null);
    setIsDraggingExternalFile(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Drop handler: Handles both INTERNAL game sorting and EXTERNAL desktop file drops!
  const handleDrop = async (e, toShelfId, toGameId = null) => {
    e.preventDefault();
    setIsDraggingExternalFile(false);

    // 1. Check if user dropped an external file (e.g. from desktop or Windows folder)
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const newGamesToAdd = [];

      for (const file of files) {
        const fullPath = file.path || '';
        if (fullPath && window.electronAPI && window.electronAPI.parseDroppedGameFile) {
          const parsed = await window.electronAPI.parseDroppedGameFile(fullPath);
          if (parsed) {
            newGamesToAdd.push(parsed);
          }
        }
      }

      if (newGamesToAdd.length > 0) {
        const newShelves = shelves.map(s => ({ ...s, games: [...s.games] }));
        const targetShelf = newShelves.find(s => s.id === toShelfId) || newShelves[0];
        if (targetShelf) {
          let insertIdx = targetShelf.games.length;
          if (toGameId) {
            const foundIdx = targetShelf.games.findIndex(g => g.id === toGameId);
            if (foundIdx !== -1) insertIdx = foundIdx;
          }
          targetShelf.games.splice(insertIdx, 0, ...newGamesToAdd);
          saveShelvesState(newShelves);

          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.8 },
            colors: ['#e5b364', '#60a5fa']
          });
        }
        return;
      }
    }

    // 2. Internal Game drag and drop (by ID)
    if (!draggedInfo) return;
    const { fromShelfId, fromGameId } = draggedInfo;

    const newShelves = shelves.map(shelf => ({
      ...shelf,
      games: [...shelf.games]
    }));

    const sourceShelf = newShelves.find(s => s.id === fromShelfId);
    const destShelf = newShelves.find(s => s.id === toShelfId);

    if (!sourceShelf || !destShelf) return;

    const sourceIndex = sourceShelf.games.findIndex(g => g.id === fromGameId);
    if (sourceIndex === -1) return;

    const [movedGame] = sourceShelf.games.splice(sourceIndex, 1);
    if (!movedGame) return;

    let destIndex = destShelf.games.length;
    if (toGameId) {
      const targetFound = destShelf.games.findIndex(g => g.id === toGameId);
      if (targetFound !== -1) {
        destIndex = targetFound;
      }
    }

    destShelf.games.splice(destIndex, 0, movedGame);
    saveShelvesState(newShelves);
    setDraggedInfo(null);
  };

  // Filtered views with exact and flexible platform match
  const filteredShelves = shelves.map(shelf => {
    const matchingGames = shelf.games.filter(g => {
      const matchSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchPlatform = true;
      if (activePlatformFilter === 'Steam') {
        matchPlatform = g.platform.toLowerCase().includes('steam');
      } else if (activePlatformFilter === 'Epic') {
        matchPlatform = g.platform.toLowerCase().includes('epic');
      } else if (activePlatformFilter === 'Xbox') {
        matchPlatform = g.platform.toLowerCase().includes('xbox');
      }

      return matchSearch && matchPlatform;
    });

    return {
      ...shelf,
      games: matchingGames
    };
  }).filter(shelf => {
    // Hide empty shelves when a specific platform or search filter is active
    if (activePlatformFilter !== 'ALL' || searchQuery !== '') {
      return shelf.games.length > 0;
    }
    return true;
  });

  const totalGameCount = shelves.reduce((acc, s) => acc + s.games.length, 0);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        userSelect: 'none',
      }}
      className={`bg-wood-wallpaper theme-wood-${woodTheme} ambience-${atmosphere}`}
      onDragOver={(e) => {
        e.preventDefault();
        // Only trigger external drop overlay if dragging actual files from outside the window
        const isFiles = e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
        if (isFiles && !draggedInfo) {
          setIsDraggingExternalFile(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
          setIsDraggingExternalFile(false);
        }
      }}
      onDrop={(e) => {
        handleDrop(e, shelves[0]?.id || 'shelf-favs', null);
      }}
    >
      {/* External File Drop Overlay Indicator */}
      {isDraggingExternalFile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
            backgroundColor: 'rgba(20, 10, 5, 0.85)',
            border: '4px dashed #e5b364',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbe3a1',
            pointerEvents: 'none',
            backdropFilter: 'blur(4px)',
          }}
        >
          <Sparkles size={48} color="#e5b364" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 800 }}>
            Oyunu Rafa Bırakın
          </h2>
          <p style={{ fontSize: '13px', color: '#c4aa95', marginTop: '6px' }}>
            Masaüstü kısayolu (.url, .lnk) veya .exe dosyası otomatik olarak taranıp kapağı bulunacaktır.
          </p>
        </div>
      )}

      {/* Barcode Laser Scan Overlay */}
      {isBarcodeScanning && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, pointerEvents: 'none' }}>
          <div className="barcode-laser-line" />
          <div
            style={{
              position: 'absolute',
              top: '50px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(255, 30, 30, 0.9)',
              color: '#fff',
              padding: '8px 18px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 800,
              boxShadow: '0 0 20px rgba(255, 0, 0, 0.8)',
              letterSpacing: '1px',
              fontFamily: 'monospace',
            }}
          >
            🔴 LAZER BARKOD OKUYUCU AKTİF...
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '34px 28px 12px 28px',
          background: 'linear-gradient(180deg, #381f12 0%, #201007 100%)',
          borderBottom: '1px solid rgba(229, 179, 100, 0.3)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
          zIndex: 40,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1.5px solid #ffe9b8',
              boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1b120c'
            }}
          >
            <img
              src={appIcon}
              alt="Physical Game Shelf"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '18px',
                fontWeight: 900,
                letterSpacing: '1.5px',
                color: '#fff3db',
              }}
            >
              PHYSICAL GAME SHELF
            </h1>
            <p style={{ fontSize: '11px', color: '#bca18c' }}>
              Nostaljik iOS 7 Ahşap Raf • {totalGameCount} Fiziksel Oyun Kutusu
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Search box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(15, 8, 4, 0.85)',
              border: '1px solid rgba(229, 179, 100, 0.3)',
              width: '230px',
            }}
          >
            <Search size={15} color="#e5b364" />
            <input
              type="text"
              placeholder="Oyunlarda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f5eedf',
                fontSize: '12px',
                width: '100%',
              }}
            />
          </div>

          {/* Platform filters */}
          <div
            style={{
              display: 'flex',
              padding: '3px',
              borderRadius: '8px',
              backgroundColor: 'rgba(15, 8, 4, 0.7)',
              border: '1px solid rgba(229, 179, 100, 0.2)',
            }}
          >
            {['ALL', 'Steam', 'Epic', 'Xbox'].map((plat) => (
              <button
                key={plat}
                onClick={() => setActivePlatformFilter(plat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: activePlatformFilter === plat ? '#e5b364' : 'transparent',
                  color: activePlatformFilter === plat ? '#1c0f07' : '#baa08b',
                }}
              >
                {plat === 'ALL' ? 'Tümü' : plat}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <button
            onClick={handleFullScan}
            disabled={loading}
            style={{
              background: 'linear-gradient(180deg, #442616 0%, #2b160b 100%)',
              border: '1px solid rgba(229, 179, 100, 0.35)',
              color: '#e5b364',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Taranıyor...' : 'Yeniden Tara'}
          </button>

          <button
            onClick={handleAddCustomGame}
            style={{
              background: 'linear-gradient(180deg, #e5b364 0%, #ab7521 100%)',
              border: '1px solid #ffe8b5',
              color: '#1a0b04',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Manuel Oyun Ekle
          </button>

          {/* Barcode Scanner Button */}
          <button
            onClick={handleTriggerBarcodeScanner}
            title="Lazer Barkod Okuyucu (Rastgele Oyun Seç & Aç)"
            style={{
              background: 'linear-gradient(180deg, #581c1c 0%, #300c0c 100%)',
              border: '1px solid #ff7b7b',
              color: '#ffbaba',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(255, 50, 50, 0.3)',
            }}
          >
            <ScanBarcode size={15} color="#ff7b7b" /> Barkod Okut
          </button>

          {/* Smart Sorting Dropdown Trigger */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                soundFX.playWoodSlide();
                setIsSortMenuOpen(!isSortMenuOpen);
                setIsThemeMenuOpen(false);
              }}
              title="Akıllı Raf Düzenleyici"
              style={{
                background: 'linear-gradient(180deg, #442616 0%, #2b160b 100%)',
                border: '1px solid rgba(229, 179, 100, 0.35)',
                color: '#e5b364',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <ArrowDownAZ size={14} /> Sırala
            </button>

            {isSortMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '38px',
                  right: 0,
                  width: '180px',
                  backgroundColor: '#201007',
                  border: '1px solid #e5b364',
                  borderRadius: '8px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.9)',
                  padding: '6px',
                  zIndex: 60,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <button
                  onClick={handleSortShelvesAlphabetical}
                  style={{
                    padding: '8px 10px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    color: '#fbe3a1',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(229, 179, 100, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <ArrowDownAZ size={14} color="#e5b364" /> A'dan Z'ye Sırala
                </button>
                <button
                  onClick={handleSortByPlatform}
                  style={{
                    padding: '8px 10px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    color: '#fbe3a1',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(229, 179, 100, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Layers size={14} color="#e5b364" /> Platforma Göre Diz
                </button>
              </div>
            )}
          </div>

          {/* Theme & Room Ambience Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                soundFX.playWoodSlide();
                setIsThemeMenuOpen(!isThemeMenuOpen);
                setIsSortMenuOpen(false);
              }}
              title="Ahşap & Oda Atmosferi"
              style={{
                background: 'linear-gradient(180deg, #442616 0%, #2b160b 100%)',
                border: '1px solid rgba(229, 179, 100, 0.35)',
                color: '#e5b364',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Palette size={14} /> Atmosfer
            </button>

            {isThemeMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '38px',
                  right: 0,
                  width: '240px',
                  backgroundColor: '#201007',
                  border: '1px solid #e5b364',
                  borderRadius: '8px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.9)',
                  padding: '12px',
                  zIndex: 60,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#c4aa95', fontWeight: 800, marginBottom: '6px' }}>🪵 AHŞAP RAF DOKUSU</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    {[
                      { id: 'walnut', label: 'Ceviz Ağacı' },
                      { id: 'mahogany', label: 'Kızıl Maun' },
                      { id: 'oak', label: 'Açık Meşe' },
                      { id: 'obsidian', label: 'Siyah Lake' },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleSelectWoodTheme(t.id)}
                        style={{
                          padding: '5px 8px',
                          fontSize: '11px',
                          borderRadius: '4px',
                          border: woodTheme === t.id ? '1px solid #ffe6a6' : '1px solid rgba(255,255,255,0.1)',
                          backgroundColor: woodTheme === t.id ? '#e5b364' : 'rgba(0,0,0,0.4)',
                          color: woodTheme === t.id ? '#1a0b04' : '#d4b79b',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(229,179,100,0.2)', paddingTop: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#c4aa95', fontWeight: 800, marginBottom: '6px' }}>🕯️ ODA AYDINLATMASI</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    {[
                      { id: 'none', label: 'Varsayılan' },
                      { id: 'fireplace', label: 'Şömine Ateşi' },
                      { id: 'cozy', label: 'Gece Lambası' },
                      { id: 'rgb', label: 'RGB Vitrin' },
                    ].map(a => (
                      <button
                        key={a.id}
                        onClick={() => handleSelectAtmosphere(a.id)}
                        style={{
                          padding: '5px 8px',
                          fontSize: '11px',
                          borderRadius: '4px',
                          border: atmosphere === a.id ? '1px solid #ffe6a6' : '1px solid rgba(255,255,255,0.1)',
                          backgroundColor: atmosphere === a.id ? '#e5b364' : 'rgba(0,0,0,0.4)',
                          color: atmosphere === a.id ? '#1a0b04' : '#d4b79b',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sound FX Mute Button */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Sesleri Aç' : 'Sesleri Kapat'}
            style={{
              background: 'linear-gradient(180deg, #442616 0%, #2b160b 100%)',
              border: '1px solid rgba(229, 179, 100, 0.35)',
              color: isMuted ? '#888' : '#e5b364',
              padding: '6px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {/* New Shelf Bar Trigger */}
          <button
            onClick={() => setIsAddingShelf(!isAddingShelf)}
            title="Yeni Raf Ekle"
            style={{
              background: 'linear-gradient(180deg, #442616 0%, #2b160b 100%)',
              border: '1px solid rgba(229, 179, 100, 0.35)',
              color: '#e5b364',
              padding: '6px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <Layers size={14} />
          </button>
        </div>
      </header>

      {/* New Shelf Bar */}
      {isAddingShelf && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 30px',
            background: 'linear-gradient(180deg, #2a150b 0%, #1c0e07 100%)',
            borderBottom: '1px solid rgba(229, 179, 100, 0.3)',
            zIndex: 30,
            flexShrink: 0,
          }}
        >
          <FolderPlus size={16} color="#e5b364" />
          <span style={{ fontSize: '13px', color: '#f5eedf', fontWeight: 600 }}>Yeni Raf Başlığı:</span>
          <input
            type="text"
            placeholder="Örn: 🎮 RPG ve Açık Dünya, 🚗 Yarış Oyunları"
            value={newShelfTitle}
            onChange={(e) => setNewShelfTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddShelf()}
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(229, 179, 100, 0.3)',
              borderRadius: '6px',
              padding: '5px 12px',
              color: '#fff',
              fontSize: '13px',
              width: '320px',
            }}
          />
          <button
            onClick={handleAddShelf}
            style={{
              backgroundColor: '#e5b364',
              color: '#1a0b04',
              fontWeight: 700,
              padding: '5px 14px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Oluştur
          </button>
        </div>
      )}

      {/* Main Bookshelf Scrollable Stage */}
      <main
        className="bookshelf-stage"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingTop: '20px',
          paddingBottom: '80px',
        }}
      >
        {loading && shelves.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '80%',
              gap: '16px',
              textAlign: 'center',
            }}
          >
            <RotateCw size={36} color="#e5b364" className="animate-spin" />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: '#fbe3a1' }}>
              Bilgisayarınızdaki Oyunlar Raflara Diziliyor...
            </h3>
          </div>
        ) : filteredShelves.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: '#e5b364' }}>
              Aramanızla Eşleşen Oyun Bulunamadı
            </h3>
            <p style={{ color: '#baa08b', fontSize: '12px', marginTop: '6px' }}>
              Masaüstünden herhangi bir oyunu veya kısayolu doğrudan bu pencereye sürükleyip bırakabilirsiniz!
            </p>
          </div>
        ) : (
          filteredShelves.map((shelf, shelfIdx) => (
            <ShelfRow
              key={shelf.id}
              shelf={shelf}
              shelfIndex={shelfIdx}
              onLaunch={handleLaunch}
              onToggleFavorite={handleToggleFavorite}
              onOpenDetails={(game) => setSelectedGame(game)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              draggedGameId={draggedInfo?.game?.id}
            />
          ))
        )}
      </main>

      {/* Physical Game Case Modal with Open Flap & Spinning Hologram CD */}
      {selectedGame && (
        <GameModal
          key={selectedGame.id}
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onLaunch={handleLaunch}
          onOpenFolder={handleOpenFolder}
          onToggleFavorite={handleToggleFavorite}
          onChangeCover={handleChangeCover}
        />
      )}
    </div>
  );
}
