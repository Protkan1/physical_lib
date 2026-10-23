import React, { useState } from 'react';
import { Eye, Sparkles, Heart, Disc } from 'lucide-react';

export default function GameCard({
  game,
  index,
  shelfId,
  onToggleFavorite,
  onOpenDetails,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging
}) {
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isOverThis, setIsOverThis] = useState(false);

  const getPlatformBanner = () => {
    // Custom case format override if set
    if (game.caseFormat === 'steelbook') {
      return { bg: 'linear-gradient(90deg, #374151, #1f2937, #4b5563)', text: '#f3f4f6', label: 'STEELBOOK® EDITION', border: '2px solid #9ca3af' };
    }
    if (game.caseFormat === 'jewel') {
      return { bg: 'linear-gradient(90deg, #18181b, #27272a)', text: '#e4e4e7', label: 'CLASSIC JEWEL CASE', border: '1.5px solid rgba(255,255,255,0.3)' };
    }
    switch (game.platform) {
      case 'Steam':
        return { bg: 'linear-gradient(90deg, #101c3d, #1b2838)', text: '#66c0f4', label: 'STEAM EDITION', border: '1.5px solid rgba(102, 192, 244, 0.4)' };
      case 'Epic Games':
        return { bg: 'linear-gradient(90deg, #2b2b2b, #121212)', text: '#ffffff', label: 'EPIC STORE', border: '1.5px solid rgba(255, 255, 255, 0.3)' };
      case 'Xbox':
        return { bg: 'linear-gradient(90deg, #0e5a1e, #107c10)', text: '#e6ffe6', label: 'XBOX SERIES', border: '1.5px solid #107c10' };
      default:
        return { bg: 'linear-gradient(90deg, #442a19, #2b180d)', text: '#e5b364', label: 'PC DVD-ROM', border: '1.5px solid rgba(229, 179, 100, 0.3)' };
    }
  };

  const banner = getPlatformBanner();

  return (
    <div
      className={`game-item-card ${isDragging ? 'dragging' : ''} ${isOverThis ? 'drag-target-over' : ''}`}
      draggable="true"
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart(e, game, shelfId, game.id);
      }}
      onDragEnd={(e) => {
        e.stopPropagation();
        setIsOverThis(false);
        if (onDragEnd) {
          onDragEnd();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOverThis(true);
        onDragOver(e);
      }}
      onDragLeave={(e) => {
        e.stopPropagation();
        setIsOverThis(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOverThis(false);
        onDrop(e, shelfId, game.id);
      }}
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenDetails(game)}
    >
      {/* 3D Box Container */}
      <div
        className="relative"
        style={{
          width: '150px',
          height: '215px',
          borderRadius: '7px',
          overflow: 'hidden',
          backgroundColor: '#1c130d',
          boxShadow: isHovered
            ? '0 25px 35px -5px rgba(0, 0, 0, 0.95), 0 0 25px rgba(229, 179, 100, 0.4)'
            : '0 12px 24px -4px rgba(0, 0, 0, 0.8), 0 4px 6px -2px rgba(0,0,0,0.6)',
          border: banner.border || '1.5px solid rgba(229, 179, 100, 0.3)',
          transition: 'all 0.25s ease',
        }}
      >
        {/* Physical Spine edge highlight */}
        <div className="case-spine-depth" />

        {/* Plastic glare wrap effect */}
        <div className="case-plastic-glare" />

        {/* Platform Header Strip */}
        <div
          style={{
            background: banner.bg,
            color: banner.text,
            fontSize: '9px',
            fontWeight: '800',
            letterSpacing: '1px',
            padding: '3px 8px',
            textAlign: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
            position: 'relative',
            zIndex: 12,
            fontFamily: 'var(--font-serif)',
          }}
        >
          {banner.label}
        </div>

        {/* Game Cover Art with Retro Stickers */}
        <div
          className="relative w-full overflow-hidden flex items-center justify-center bg-[#120a06]"
          style={{ height: '156px', position: 'relative' }}
        >
          {/* Holographic Collector Sticker (Top Right) */}
          {game.isFavorite && (
            <div
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                zIndex: 14,
                backgroundColor: 'rgba(229, 179, 100, 0.95)',
                color: '#1a0b04',
                fontSize: '8px',
                fontWeight: 900,
                padding: '2px 5px',
                borderRadius: '3px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.8), 0 0 10px rgba(255, 220, 120, 0.8)',
                letterSpacing: '0.5px',
                border: '1px solid #fff3db',
              }}
            >
              ★ FAVORİ
            </div>
          )}

          {/* Nostalgic PEGI Rating badge (Bottom Left) */}
          <div
            style={{
              position: 'absolute',
              bottom: '6px',
              left: '6px',
              zIndex: 14,
              backgroundColor: '#111',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '2px',
              padding: '1px 4px',
              fontSize: '8px',
              fontWeight: 900,
              boxShadow: '0 2px 4px rgba(0,0,0,0.8)',
            }}
          >
            18+
          </div>
          {game.coverUrl && !imgError ? (
            <img
              src={game.coverUrl}
              alt={game.title}
              onError={() => setImgError(true)}
              draggable="false"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                pointerEvents: 'none',
              }}
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center p-3 text-center"
              style={{
                background: 'radial-gradient(circle at center, #3d2112 0%, #1a0c06 100%)',
                border: '2px dashed rgba(229, 179, 100, 0.3)',
                margin: '4px',
                borderRadius: '4px',
              }}
            >
              <Sparkles size={24} color="#e5b364" style={{ marginBottom: '8px' }} />
              <div
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-serif)',
                  color: '#f5eedf',
                  fontWeight: 700,
                  lineHeight: '1.2',
                  textTransform: 'uppercase',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {game.title}
              </div>
            </div>
          )}

          {/* Quick INSPECT / KUTUYU AÇ Button on Hover */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.55)',
              opacity: isHovered ? 1 : 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.2s ease',
              zIndex: 15,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(game);
            }}
          >
            <button
              style={{
                background: 'linear-gradient(135deg, #e5b364, #b27a23)',
                color: '#1a0b04',
                padding: '9px 16px',
                borderRadius: '50px',
                border: '2px solid #fff2cc',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                fontSize: '11.5px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.8)',
              }}
            >
              <Disc size={13} fill="#1a0b04" /> KUTUYU AÇ
            </button>
          </div>
        </div>

        {/* Physical Box Bottom Spine Tag */}
        <div
          style={{
            height: '28px',
            backgroundColor: '#1e1109',
            borderTop: '1px solid rgba(229, 179, 100, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px',
            position: 'relative',
            zIndex: 12,
          }}
        >
          <span
            style={{
              color: '#d4b79b',
              fontSize: '10px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '105px',
            }}
          >
            {game.title}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(game.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
            }}
            title={game.isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
          >
            <Heart
              size={13}
              fill={game.isFavorite ? '#e5b364' : 'transparent'}
              color={game.isFavorite ? '#e5b364' : '#8a6e59'}
            />
          </button>
        </div>
      </div>

      {/* Shadow casted on top of the wooden plank */}
      <div className="case-wood-shadow" />
    </div>
  );
}
