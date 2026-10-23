import React from 'react';
import GameCard from './GameCard';
import { Bookmark } from 'lucide-react';

export default function ShelfRow({
  shelf,
  shelfIndex,
  onLaunch,
  onToggleFavorite,
  onOpenDetails,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  draggedGameId
}) {
  return (
    <div className="wooden-shelf select-none">
      {/* Games standing on shelf - Strictly flex-row, horizontal overflow */}
      <div
        className="shelf-games-row"
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver(e);
        }}
        onDrop={(e) => {
          e.preventDefault();
          onDrop(e, shelf.id, null);
        }}
      >
        {shelf.games.length > 0 ? (
          shelf.games.map((game, idx) => (
            <GameCard
              key={game.id}
              game={game}
              index={idx}
              shelfId={shelf.id}
              onLaunch={onLaunch}
              onToggleFavorite={onToggleFavorite}
              onOpenDetails={onOpenDetails}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={onDrop}
              isDragging={draggedGameId === game.id}
            />
          ))
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '35px 0',
              fontStyle: 'italic',
              fontSize: '13px',
              color: 'rgba(229, 179, 100, 0.45)',
              fontFamily: 'var(--font-serif)',
              letterSpacing: '1px'
            }}
          >
            — Bu rafa bir oyunu sürükleyip bırakabilirsiniz —
          </div>
        )}
      </div>

      {/* 3D Wood Shelf Top Plank */}
      <div className="shelf-board-top" />

      {/* 3D Wood Shelf Front Bevel with Brass Nameplate */}
      <div className="shelf-board-front">
        <div className="shelf-brass-plate">
          <Bookmark size={12} color="#2b1704" />
          <span>{shelf.title}</span>
          <span style={{ opacity: 0.65, fontSize: '10px' }}>({shelf.games.length})</span>
        </div>
      </div>
    </div>
  );
}
