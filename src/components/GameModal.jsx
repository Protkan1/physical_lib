import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Heart,
  RotateCcw,
  Sparkles,
  Move,
  Move3d,
  Magnet,
  BookOpen
} from 'lucide-react';
import { soundFX } from '../utils/soundFX';
import GameManualModal from './GameManualModal';

export default function GameModal({
  game,
  onClose,
  onLaunch,
  onToggleFavorite,
}) {
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [caseTheme, setCaseTheme] = useState(() => game.caseFormat || 'ps4');

  // CD Position (X, Y offset in pixels) - moved by Left Mouse Click drag
  const [pos, setPos] = useState({ x: 0, y: 0 });

  // CD 3D Rotation (Pitch X, Yaw Y degrees, 360 full range)
  const [rot, setRot] = useState({ x: 0, y: 0 });

  // Interaction modes
  const [dragMode, setDragMode] = useState(null); // 'move' (Left Click) | 'rotate' (Right Click)
  const [isSpinningAuto, setIsSpinningAuto] = useState(false);
  const [isMagneticPulling, setIsMagneticPulling] = useState(false);
  const [isSnappedInPlace, setIsSnappedInPlace] = useState(true);

  // Closing animation state
  const [isClosing, setIsClosing] = useState(false);

  // CRITICAL FIX: Reset closing animation & disc state whenever a game is opened
  useEffect(() => {
    if (game) {
      setIsClosing(false);
      setPos({ x: 0, y: 0 });
      setRot({ x: 0, y: 0 });
      setIsSnappedInPlace(true);
      setIsMagneticPulling(false);
      setIsSpinningAuto(false);
    }
  }, [game?.id]);

  const startDragRef = useRef({
    mouseX: 0,
    mouseY: 0,
    startPosX: 0,
    startPosY: 0,
    startRotX: 0,
    startRotY: 0,
  });

  // Sound effect / Haptic click feedback using Web Audio API (Soft mechanical click)
  const playSnapSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  };

  // Trigger Close with Animation
  const handleAnimatedClose = () => {
    soundFX.playCaseClose();
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 450); // match closing animation duration
  };

  // Handle Mouse Down on the Disc
  const handleDiscMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (e.button === 0) {
      if (isSnappedInPlace) {
        soundFX.playSpindleRelease();
      }
      setDragMode('move');
      setIsSnappedInPlace(false);
    } else if (e.button === 2) {
      setDragMode('rotate');
      setIsSpinningAuto(false);
    }

    startDragRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
      startRotX: rot.x,
      startRotY: rot.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragMode) return;
      const deltaX = e.clientX - startDragRef.current.mouseX;
      const deltaY = e.clientY - startDragRef.current.mouseY;

      if (dragMode === 'move') {
        const rawTargetX = startDragRef.current.startPosX + deltaX;
        const rawTargetY = startDragRef.current.startPosY + deltaY;

        // Calculate distance to origin (0, 0 is the spindle center)
        const distanceToSpindle = Math.sqrt(rawTargetX * rawTargetX + rawTargetY * rawTargetY);
        const magnetThreshold = 135; // MagSafe magnetic field radius in pixels

        if (distanceToSpindle < magnetThreshold) {
          setIsMagneticPulling(true);
          // MagSafe magnetic resistance & attraction formula
          // Pulls the disc smoothly towards center without totally seizing user control
          const magneticDamping = Math.pow(distanceToSpindle / magnetThreshold, 1.6);
          const pulledX = rawTargetX * magneticDamping;
          const pulledY = rawTargetY * magneticDamping;

          setPos({ x: pulledX, y: pulledY });

          // MagSafe magnetic alignment: disc rotation gently levels out to snap flat
          setRot(prev => ({
            x: prev.x * 0.94,
            y: prev.y * 0.94
          }));
        } else {
          setIsMagneticPulling(false);
          setPos({ x: rawTargetX, y: rawTargetY });
        }
      } else if (dragMode === 'rotate') {
        setRot({
          x: (startDragRef.current.startRotX - deltaY * 0.7) % 360,
          y: (startDragRef.current.startRotY + deltaX * 0.7) % 360,
        });
      }
    };

    const handleMouseUp = () => {
      if (dragMode === 'move') {
        // If released within snap range, snap directly into the spindle like MagSafe!
        const finalDist = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
        if (finalDist < 90) {
          setPos({ x: 0, y: 0 });
          setRot({ x: 0, y: 0 });
          setIsSnappedInPlace(true);
          setIsMagneticPulling(false);
          soundFX.playMagSafeSnap();
        } else {
          setIsSnappedInPlace(false);
        }
      }
      setDragMode(null);
    };

    if (dragMode) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragMode, pos, rot]);

  const resetDisc = () => {
    setPos({ x: 0, y: 0 });
    setRot({ x: 0, y: 0 });
    setIsSpinningAuto(false);
    setIsSnappedInPlace(true);
    soundFX.playMagSafeSnap();
  };

  const normalizedYaw = Math.abs(rot.y % 360);
  const isBackSideFacing = normalizedYaw > 90 && normalizedYaw < 270;

  if (!game) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(10px)',
        padding: '20px',
        animation: isClosing ? 'fadeOutModal 0.45s ease forwards' : 'fadeInModal 0.35s ease forwards',
        perspective: '1500px',
      }}
      onClick={handleAnimatedClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOutModal {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        /* 3D Case Opening Animation */
        @keyframes openPs4Case {
          0% {
            opacity: 0;
            transform: scale(0.65) translateY(50px) rotateX(25deg);
          }
          60% {
            opacity: 1;
            transform: scale(1.02) translateY(-6px) rotateX(0deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0) rotateX(0deg);
          }
        }

        /* 3D Case Smooth Closing Animation (Fiziksel kutuyu kapatır gibi) */
        @keyframes closePs4Case {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0) rotateX(0deg);
          }
          40% {
            opacity: 0.9;
            transform: scale(0.95) translateY(-10px) rotateX(10deg);
          }
          100% {
            opacity: 0;
            transform: scale(0.55) translateY(60px) rotateX(35deg);
          }
        }

        /* Left Flap Swing open */
        @keyframes flapSwingOpen {
          0% {
            transform: rotateY(70deg);
            filter: brightness(0.6);
          }
          100% {
            transform: rotateY(0deg);
            filter: brightness(1);
          }
        }

        /* Left Flap Swing close */
        @keyframes flapSwingClose {
          0% {
            transform: rotateY(0deg);
            filter: brightness(1);
          }
          100% {
            transform: rotateY(85deg);
            filter: brightness(0.5);
          }
        }

        .ps4-case-container {
          animation: ${isClosing ? 'closePs4Case 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'openPs4Case 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards'};
          transform-style: preserve-3d;
        }

        .ps4-left-flap {
          transform-origin: right center;
          animation: ${isClosing ? 'flapSwingClose 0.45s ease forwards' : 'flapSwingOpen 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'};
        }

        /* 3D Double Sided Disc */
        .double-sided-disc {
          position: relative;
          width: 310px;
          height: 310px;
          border-radius: 50%;
          transform-style: preserve-3d;
          transition: ${dragMode === 'move' ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease'};
        }

        .disc-face-front,
        .disc-face-back {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          overflow: hidden;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .disc-face-front {
          transform: rotateY(0deg);
          background-color: #0f172a;
          border: 2px solid rgba(255, 255, 255, 0.4);
        }

        .disc-face-back {
          transform: rotateY(180deg);
          background: radial-gradient(circle at center, #1b212d 20%, #0d121c 65%, #05070a 90%);
          border: 2px solid rgba(200, 220, 255, 0.5);
          box-shadow: inset 0 0 40px rgba(0,0,0,0.9);
        }

        /* Backside Blu-ray Mirror Tracks & Radial Tracks */
        .mirror-data-grooves {
          position: absolute;
          inset: 15px;
          border-radius: 50%;
          border: 1px dashed rgba(255, 255, 255, 0.15);
          background: 
            radial-gradient(circle at center, transparent 35%, rgba(100, 160, 255, 0.2) 36%, transparent 38%, rgba(255, 255, 255, 0.1) 45%, transparent 70%),
            conic-gradient(from 45deg, rgba(255,100,100,0.5), rgba(255,255,100,0.5), rgba(100,255,100,0.5), rgba(100,200,255,0.7), rgba(200,100,255,0.5), rgba(255,100,100,0.5));
          mix-blend-mode: color-dodge;
          opacity: 0.85;
        }

        /* MagSafe Magnetic Glow Pulse on Spindle */
        @keyframes magSafeGlow {
          0% { box-shadow: 0 0 15px rgba(96, 165, 250, 0.4), inset 0 0 15px rgba(96, 165, 250, 0.3); }
          50% { box-shadow: 0 0 35px rgba(96, 165, 250, 0.9), inset 0 0 25px rgba(96, 165, 250, 0.7); }
          100% { box-shadow: 0 0 15px rgba(96, 165, 250, 0.4), inset 0 0 15px rgba(96, 165, 250, 0.3); }
        }

        .magsafe-active-spindle {
          animation: magSafeGlow 1.2s infinite ease-in-out;
          border-color: #60a5fa !important;
        }
      `}</style>

      {/* Outer Case Wrapper */}
      <div
        className="ps4-case-container"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '1020px',
          width: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Controls Bar */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
            padding: '0 8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 800,
                fontSize: '17px',
                color: '#60a5fa',
                letterSpacing: '1px',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              PS4™ BLU-RAY DISC CASE
            </span>
            <span style={{ color: '#93c5fd', fontSize: '14px', fontWeight: 600 }}>
              • {game.title}
            </span>

            {isMagneticPulling && (
              <span
                style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.85)',
                  color: '#ffffff',
                  border: '1px solid #93c5fd',
                  borderRadius: '14px',
                  padding: '2px 10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 0 15px rgba(96, 165, 250, 0.8)',
                }}
              >
                <Magnet size={12} /> MAGSAFE MANYETİK ÇEKİM
              </span>
            )}

            {isSnappedInPlace && !isMagneticPulling && (
              <span
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#6ee7b7',
                  border: '1px solid rgba(110, 231, 183, 0.4)',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                ✓ YUVASINA OTURDU
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => onLaunch(game)}
              style={{
                background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: '1px solid #93c5fd',
                padding: '8px 22px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.5)',
              }}
            >
              <Play size={14} fill="#fff" /> DİSKİ TAK & OYNA
            </button>

            <button
              onClick={() => onToggleFavorite(game.id)}
              style={{
                background: 'rgba(30, 58, 138, 0.5)',
                border: '1px solid rgba(96, 165, 250, 0.4)',
                color: '#93c5fd',
                borderRadius: '8px',
                padding: '8px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
              }}
            >
              <Heart size={14} fill={game.isFavorite ? '#60a5fa' : 'transparent'} />
              {game.isFavorite ? 'Favori' : 'Favorilere Ekle'}
            </button>

            {/* Case Theme Selector Buttons */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>
              {[
                { id: 'ps4', label: 'PS4 Mavi', bg: '#00439c' },
                { id: 'xbox', label: 'Xbox Yeşil', bg: '#0e5a1e' },
                { id: 'steelbook', label: 'Steelbook Metal', bg: '#374151' },
              ].map(th => (
                <button
                  key={th.id}
                  onClick={() => {
                    soundFX.playCaseOpen();
                    setCaseTheme(th.id);
                  }}
                  style={{
                    backgroundColor: caseTheme === th.id ? th.bg : 'transparent',
                    color: caseTheme === th.id ? '#fff' : '#94a3b8',
                    border: caseTheme === th.id ? '1px solid rgba(255,255,255,0.4)' : 'none',
                    borderRadius: '5px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {th.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleAnimatedClose}
              title="Kutuyu Kapat"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Real PS4 / Xbox / Steelbook Opened Plastic Case */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            width: '940px',
            height: '530px',
            backgroundColor: caseTheme === 'xbox' ? '#0b3a16' : caseTheme === 'steelbook' ? '#272d37' : '#00439c',
            backgroundImage: caseTheme === 'xbox'
              ? 'linear-gradient(135deg, rgba(16, 124, 16, 0.96) 0%, rgba(10, 60, 10, 0.99) 100%)'
              : caseTheme === 'steelbook'
              ? 'linear-gradient(135deg, #4b5563 0%, #1f2937 50%, #374151 100%)'
              : 'linear-gradient(135deg, rgba(0, 102, 204, 0.96) 0%, rgba(0, 48, 135, 0.99) 100%)',
            borderRadius: '16px',
            border: caseTheme === 'xbox' ? '4px solid #16a34a' : caseTheme === 'steelbook' ? '4px solid #9ca3af' : '4px solid #1d72d6',
            boxShadow: caseTheme === 'steelbook'
              ? '0 30px 70px rgba(0, 0, 0, 0.95), inset 0 2px 6px rgba(255, 255, 255, 0.6), 0 0 35px rgba(156, 163, 175, 0.3)'
              : '0 30px 70px rgba(0, 0, 0, 0.95), inset 0 2px 6px rgba(255, 255, 255, 0.4), 0 0 40px rgba(0, 102, 204, 0.4)',
            position: 'relative',
            overflow: 'visible',
          }}
        >
          {/* SOL KANAT (Dynamic structure per theme) */}
          <div
            className="ps4-left-flap"
            style={{
              flex: 1,
              height: '100%',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              backgroundColor: caseTheme === 'xbox'
                ? 'rgba(10, 50, 15, 0.45)'
                : caseTheme === 'steelbook'
                ? 'rgba(30, 35, 45, 0.7)'
                : 'rgba(0, 60, 150, 0.35)',
              borderRight: caseTheme === 'xbox' ? '3px solid #08280f' : caseTheme === 'steelbook' ? '3px solid #111827' : '3px solid #002b66',
              boxShadow: caseTheme === 'steelbook' ? 'inset 0 0 35px rgba(0, 0, 0, 0.8)' : 'inset 0 0 30px rgba(0, 20, 60, 0.6)',
            }}
          >
            {/* Plastic Retaining Clip Top */}
            <div
              style={{
                position: 'absolute',
                top: '40px',
                right: '18px',
                width: caseTheme === 'steelbook' ? '12px' : '18px',
                height: '36px',
                backgroundColor: caseTheme === 'steelbook' ? 'rgba(200, 200, 200, 0.4)' : caseTheme === 'xbox' ? 'rgba(120, 255, 120, 0.3)' : 'rgba(255, 255, 255, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '4px',
                zIndex: 20,
              }}
            />

            {/* Plastic Retaining Clip Bottom */}
            <div
              style={{
                position: 'absolute',
                bottom: '40px',
                right: '18px',
                width: caseTheme === 'steelbook' ? '12px' : '18px',
                height: '36px',
                backgroundColor: caseTheme === 'steelbook' ? 'rgba(200, 200, 200, 0.4)' : caseTheme === 'xbox' ? 'rgba(120, 255, 120, 0.3)' : 'rgba(255, 255, 255, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '4px',
                zIndex: 20,
              }}
            />

            {/* Inset White Warranty / Legal Booklet Paper (Interactive - Click to open full manual) */}
            <div
              onClick={() => {
                soundFX.playPageTurn();
                setIsManualOpen(true);
              }}
              style={{
                width: '88%',
                height: '92%',
                backgroundColor: caseTheme === 'steelbook' ? '#f5f5f7' : '#ffffff',
                backgroundImage: caseTheme === 'steelbook'
                  ? 'linear-gradient(to bottom, #ffffff 0%, #e5e7eb 100%)'
                  : 'linear-gradient(to bottom, #fcfcfc 0%, #f0f3f8 100%)',
                borderRadius: caseTheme === 'steelbook' ? '8px' : '6px',
                padding: '20px 18px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#1a273b',
                fontFamily: 'system-ui, sans-serif',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: caseTheme === 'steelbook' ? '1px solid #9ca3af' : 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02) rotate(-0.5deg)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5)';
              }}
              title="Kılavuzu açmak için tıklayın (Sayfaları çevirin)"
            >
              {/* Corner Interactive Ribbon */}
              <div
                style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  backgroundColor: caseTheme === 'xbox' ? '#16a34a' : caseTheme === 'steelbook' ? '#374151' : '#e5b364',
                  color: caseTheme === 'xbox' || caseTheme === 'steelbook' ? '#ffffff' : '#1a0b04',
                  padding: '3px 8px',
                  borderBottomLeftRadius: '6px',
                  fontSize: '9px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                }}
              >
                <BookOpen size={10} /> KILAVUZU AÇ ↗
              </div>
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: caseTheme === 'xbox' ? '2px solid #16a34a' : caseTheme === 'steelbook' ? '2px solid #4b5563' : '2px solid #00439c',
                  paddingBottom: '6px',
                  marginBottom: '10px'
                }}>
                  <span style={{
                    fontWeight: 900,
                    fontSize: '13px',
                    color: caseTheme === 'xbox' ? '#15803d' : caseTheme === 'steelbook' ? '#1f2937' : '#00439c',
                    letterSpacing: '1px'
                  }}>
                    {caseTheme === 'steelbook' ? 'KOLEKSİYONCU BASKISI' : 'GARANTİ VE GÜVENLİK'}
                  </span>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>
                    {caseTheme === 'xbox' ? 'XBOX SERIES X|S' : caseTheme === 'steelbook' ? 'STEELBOOK®' : 'PLAYSTATION®4'}
                  </span>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                  {game.title}
                </h3>

                <p style={{ fontSize: '11px', color: '#475569', lineHeight: '1.45', marginBottom: '8px' }}>
                  {caseTheme === 'steelbook'
                    ? 'Özel metalik kabartma ve mat cila ile üretilmiş sınırlı üretim fiziksel koleksiyon diski.'
                    : 'Bu optik disk lisanslıdır ve sisteminizde çalıştırılmaya hazırdır. Oyun verileri yerel depolama biriminizden okunmaktadır.'}
                </p>

                <div style={{ backgroundColor: '#f1f5f9', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '10.5px', color: '#334155' }}>
                  <div>• <strong>Format:</strong> {caseTheme === 'xbox' ? 'Xbox Game Disc' : caseTheme === 'steelbook' ? 'Collector Metal Box' : 'Blu-ray Disc'}</div>
                  <div>• <strong>Depolama:</strong> {game.sizeBytes > 0 ? (game.sizeBytes / (1024*1024*1024)).toFixed(1) + ' GB' : 'Yerel Kurulu'}</div>
                  <div style={{ wordBreak: 'break-all' }}>• <strong>Dizin:</strong> {game.installPath || game.launchUrl}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '9px', color: '#64748b', lineHeight: '1.4', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                  <strong>LİSANS:</strong> {caseTheme === 'xbox' ? 'Microsoft Xbox Corporation' : caseTheme === 'steelbook' ? 'Scanavo SteelBook Packaging Licensing' : 'Sony Interactive Entertainment Inc.'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: caseTheme === 'xbox' ? '#16a34a' : caseTheme === 'steelbook' ? '#374151' : '#00439c' }}>
                    {caseTheme === 'xbox' ? 'XBOX VELOCITY ARCHITECTURE' : caseTheme === 'steelbook' ? 'OFFICIAL STEELBOOK® EDITION' : 'BLU-RAY™ DISC COMPATIBLE'}
                  </span>
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>#{game.appId || '7729'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ORTA MENTEŞE */}
          <div
            style={{
              width: '24px',
              height: '100%',
              backgroundColor: caseTheme === 'xbox' ? '#092d11' : caseTheme === 'steelbook' ? '#1f2937' : '#002f75',
              backgroundImage: caseTheme === 'steelbook'
                ? 'linear-gradient(to right, #111827 0%, #6b7280 50%, #111827 100%)'
                : 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(255,255,255,0.2) 50%, rgba(0,0,0,0.5) 100%)',
              borderLeft: '1px solid rgba(255,255,255,0.15)',
              borderRight: '1px solid rgba(255,255,255,0.15)',
              position: 'relative',
              zIndex: 10,
            }}
          />

          {/* SAĞ KANAT: RESMİ SPINDLE VE MANYETİK ÇEKİM ALANI */}
          <div
            style={{
              flex: 1,
              height: '100%',
              padding: '24px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              backgroundColor: caseTheme === 'xbox'
                ? 'rgba(10, 45, 15, 0.5)'
                : caseTheme === 'steelbook'
                ? 'rgba(25, 30, 40, 0.75)'
                : 'rgba(0, 50, 130, 0.4)',
              boxShadow: caseTheme === 'steelbook' ? 'inset 0 0 40px rgba(0, 0, 0, 0.85)' : 'inset 0 0 35px rgba(0, 15, 50, 0.7)',
            }}
          >
            {/* Voucher Clips */}
            <div
              style={{
                position: 'absolute',
                top: '40px',
                left: '20px',
                width: '42px',
                height: '24px',
                backgroundColor: caseTheme === 'steelbook' ? 'rgba(200, 200, 200, 0.35)' : caseTheme === 'xbox' ? 'rgba(120, 255, 120, 0.25)' : 'rgba(255, 255, 255, 0.2)',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '5px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '40px',
                left: '20px',
                width: '42px',
                height: '24px',
                backgroundColor: caseTheme === 'steelbook' ? 'rgba(200, 200, 200, 0.35)' : caseTheme === 'xbox' ? 'rgba(120, 255, 120, 0.25)' : 'rgba(255, 255, 255, 0.2)',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '5px',
              }}
            />

            {/* Circular Spindle Tray with MagSafe Visual Indicator */}
            <div
              className={isMagneticPulling ? 'magsafe-active-spindle' : ''}
              style={{
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                border: isMagneticPulling
                  ? (caseTheme === 'xbox' ? '2.5px solid #22c55e' : '2.5px solid #60a5fa')
                  : '2px solid rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isMagneticPulling
                  ? (caseTheme === 'xbox' ? '0 0 30px rgba(34, 197, 94, 0.7)' : '0 0 30px rgba(96, 165, 250, 0.7)')
                  : 'inset 0 0 15px rgba(0,0,0,0.5)',
                position: 'relative',
                transition: 'all 0.25s ease',
              }}
            >
              {/* Spindle Hub Mold */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: isMagneticPulling ? '2px solid #93c5fd' : '2px solid rgba(255, 255, 255, 0.35)',
                  backgroundColor: caseTheme === 'xbox' ? 'rgba(10, 60, 20, 0.8)' : caseTheme === 'steelbook' ? 'rgba(30, 35, 45, 0.9)' : 'rgba(0, 40, 110, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: isMagneticPulling ? 'rgba(96, 165, 250, 0.5)' : 'rgba(255, 255, 255, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                  }}
                />
              </div>

              {/* 3D FREELY MOVABLE & MAGSAFE SNAPPABLE BLU-RAY DISC */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 35,
                  perspective: '1200px',
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                  transition: dragMode === 'move' ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  cursor: dragMode === 'move' ? 'move' : dragMode === 'rotate' ? 'crosshair' : 'grab',
                }}
                onMouseDown={handleDiscMouseDown}
              >
                {/* 3D Double Sided Disc Mesh */}
                <div
                  className={`double-sided-disc ${isSpinningAuto ? 'cd-spinning' : ''}`}
                  style={{
                    transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg) ${
                      isMagneticPulling
                        ? 'scale(1.04) translateZ(20px)'
                        : dragMode
                        ? 'scale(1.08) translateZ(40px)'
                        : 'translateZ(10px)'
                    }`,
                    boxShadow: isMagneticPulling
                      ? '0 0 35px rgba(96, 165, 250, 0.85), 0 20px 40px rgba(0,0,0,0.8)'
                      : dragMode
                      ? '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(96, 165, 250, 0.7)'
                      : '0 12px 35px rgba(0, 0, 0, 0.8)',
                  }}
                >
                  {/* ====== ÖN YÜZEY (FRONT FACE) ====== */}
                  <div className="disc-face-front">
                    {game.coverUrl ? (
                      <img
                        src={game.coverUrl}
                        alt={game.title}
                        draggable="false"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: 'contrast(1.15) brightness(0.95)',
                          pointerEvents: 'none',
                        }}
                      />
                    ) : null}

                    {/* Rainbow Optical Hologram */}
                    <div
                      className="absolute inset-0 cd-hologram pointer-events-none"
                      style={{
                        opacity: 0.65,
                        transform: `rotate(${rot.y * 1.5}deg)`,
                      }}
                    />

                    {/* Lighting */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(${rot.y * 2 + 45}deg, rgba(255,255,255,0.2) 0%, transparent 45%, rgba(0,0,0,0.5) 100%)`,
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Inner Clear Plastic Ring */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at center, rgba(0,0,0,0.9) 30%, rgba(255,255,255,0.25) 32%, rgba(0,0,0,0.4) 70%)',
                        border: '2px solid rgba(255, 255, 255, 0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        pointerEvents: 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0, 30, 80, 0.95)',
                          border: '2px solid #60a5fa',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)',
                        }}
                      />
                    </div>

                    {/* Front Disc PS4 Logo */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '34px',
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                        color: '#ffffff',
                        fontFamily: 'system-ui, sans-serif',
                        fontWeight: 900,
                        fontSize: '14px',
                        letterSpacing: '2px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                        pointerEvents: 'none',
                        zIndex: 12,
                      }}
                    >
                      PlayStation®4
                    </div>

                    {/* Front Game Title */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '38px',
                        left: '20px',
                        right: '20px',
                        textAlign: 'center',
                        color: '#ffffff',
                        fontFamily: 'var(--font-serif)',
                        fontWeight: 800,
                        fontSize: '12px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                        pointerEvents: 'none',
                        zIndex: 12,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {game.title}
                    </div>
                  </div>

                  {/* ====== ARKA YÜZEY (BACK FACE) ====== */}
                  <div className="disc-face-back">
                    <div className="mirror-data-grooves" />
                    <div
                      style={{
                        position: 'absolute',
                        inset: '25px',
                        borderRadius: '50%',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.7)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: '45px',
                        borderRadius: '50%',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    />

                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at center, rgba(0,0,0,0.95) 30%, rgba(255,255,255,0.3) 32%, rgba(0,0,0,0.5) 70%)',
                        border: '2px solid rgba(255, 255, 255, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        pointerEvents: 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(5, 15, 30, 0.98)',
                          border: '2px solid #93c5fd',
                        }}
                      />
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '124px',
                        height: '124px',
                        borderRadius: '50%',
                        border: '1px dashed rgba(255, 255, 255, 0.35)',
                        pointerEvents: 'none',
                      }}
                    />

                    <div
                      style={{
                        position: 'absolute',
                        bottom: '55px',
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                        color: 'rgba(255, 255, 255, 0.75)',
                        fontSize: '9px',
                        fontFamily: 'monospace',
                        letterSpacing: '1px',
                        pointerEvents: 'none',
                      }}
                    >
                      BVP-CUSA-{game.appId || '00730'} L0 0100
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div
          style={{
            marginTop: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            color: '#93c5fd',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid rgba(96, 165, 250, 0.35)',
            }}
          >
            <Move size={14} color="#60a5fa" />
            <span><strong>Sol Tık:</strong> Taşı (MagSafe ile yuvasına yaklaşınca çeker)</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid rgba(96, 165, 250, 0.35)',
            }}
          >
            <Move3d size={14} color="#60a5fa" />
            <span><strong>Sağ Tık:</strong> 360° İncele</span>
          </div>

          <button
            onClick={resetDisc}
            style={{
              background: 'rgba(30, 58, 138, 0.5)',
              border: '1px solid rgba(96, 165, 250, 0.4)',
              color: '#93c5fd',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '11.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RotateCcw size={13} /> Yuvasına Oturt
          </button>

          <button
            onClick={() => setIsSpinningAuto(!isSpinningAuto)}
            style={{
              background: isSpinningAuto ? '#2563eb' : 'rgba(30, 58, 138, 0.5)',
              border: '1px solid rgba(96, 165, 250, 0.4)',
              color: '#fff',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '11.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={13} /> {isSpinningAuto ? 'Dönüşü Durdur' : 'Otomatik Dönüş'}
          </button>
        </div>
      </div>

      {/* Interactive 3D Game Booklet / Manual */}
      {isManualOpen && (
        <GameManualModal
          game={game}
          onClose={() => setIsManualOpen(false)}
        />
      )}
    </div>
  );
}
