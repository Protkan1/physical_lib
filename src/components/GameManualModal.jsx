import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, BookOpen, ShieldCheck, Gamepad2, Cpu, Sparkles } from 'lucide-react';
import { soundFX } from '../utils/soundFX';

export default function GameManualModal({ game, onClose }) {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = 4; // 0: Cover/Info, 1: Overview & Screens, 2: Controls, 3: Specs & Warranty

  const nextPage = (e) => {
    e?.stopPropagation?.();
    if (currentPage < totalPages - 1) {
      soundFX.playPageTurn();
      setCurrentPage(p => p + 1);
    }
  };

  const prevPage = (e) => {
    e?.stopPropagation?.();
    if (currentPage > 0) {
      soundFX.playPageTurn();
      setCurrentPage(p => p - 1);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: 'rgba(5, 3, 2, 0.92)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1400px',
        animation: 'fadeIn 0.25s ease-out',
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) {
          soundFX.playPageTurn();
          onClose();
        }
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '740px',
          height: '520px',
          backgroundColor: '#f6f3ea',
          backgroundImage: 'radial-gradient(#e5dec9 1px, transparent 1px), linear-gradient(180deg, #fbf9f4 0%, #ebe4d2 100%)',
          backgroundSize: '16px 16px, 100% 100%',
          borderRadius: '8px 16px 16px 8px',
          boxShadow: '0 30px 90px rgba(0,0,0,0.9), inset 20px 0 30px rgba(0,0,0,0.12), inset -4px 0 10px rgba(0,0,0,0.08)',
          border: '1px solid #d4c8b0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          userSelect: 'none',
        }}
      >
        {/* Booklet Spine / Stitching effect */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '28px',
            background: 'linear-gradient(90deg, #2a1b12 0%, #442a1c 40%, #1a0f09 100%)',
            boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.5), 3px 0 6px rgba(0,0,0,0.25)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '20px 0',
          }}
        >
          {/* Metallic staples */}
          <div style={{ width: '6px', height: '22px', backgroundColor: '#silver', border: '1px solid #666', borderRadius: '2px', background: 'linear-gradient(90deg, #999, #eee, #777)' }} />
          <div style={{ width: '6px', height: '22px', backgroundColor: '#silver', border: '1px solid #666', borderRadius: '2px', background: 'linear-gradient(90deg, #999, #eee, #777)' }} />
        </div>

        {/* Header Bar */}
        <div
          style={{
            padding: '16px 24px 12px 48px',
            borderBottom: '2px solid #dfd3be',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(235, 225, 205, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="#7c4a1e" />
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#7c4a1e', letterSpacing: '1px', textTransform: 'uppercase' }}>
              RESMİ KULLANIM KILAVUZU & DOKÜMANTASYON
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '12px', color: '#887460', fontWeight: 600 }}>
              Sayfa {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => {
                soundFX.playCaseClose();
                onClose();
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6e5d4d',
                padding: '4px',
                borderRadius: '4px',
              }}
              title="Kapat"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, padding: '24px 32px 20px 52px', overflowY: 'auto', position: 'relative' }}>
          {currentPage === 0 && (
            <div style={{ display: 'flex', gap: '28px', height: '100%', alignItems: 'center' }}>
              <div
                style={{
                  width: '210px',
                  height: '290px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
                  border: '1px solid #c2b295',
                  flexShrink: 0,
                  backgroundColor: '#000',
                }}
              >
                {game.coverUrl ? (
                  <img src={game.coverUrl} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    {game.title}
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#e5b364', color: '#2b160b', fontSize: '10px', fontWeight: 900, marginBottom: '8px' }}>
                  {game.platform?.toUpperCase() || 'PC EDITION'}
                </div>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: '#2b160b', fontWeight: 900, lineHeight: 1.2, marginBottom: '10px' }}>
                  {game.title}
                </h1>
                <p style={{ fontSize: '13px', color: '#685444', lineHeight: 1.6, marginBottom: '16px' }}>
                  Bu resmi koleksiyon kitapçığı; oyunun kurulumu, kontrol şemaları, sistem özellikleri ve optik veri diski güvenliği hakkında temel bilgileri içerir.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '12px', backgroundColor: 'rgba(215, 200, 175, 0.35)', borderRadius: '6px', border: '1px solid #d5c7af', fontSize: '11px', color: '#4a3b2c' }}>
                  <div><strong>Platform:</strong> {game.platform}</div>
                  <div><strong>Kurulum Yeri:</strong> {game.installPath ? 'Yerel Sürücü' : 'Kayıtlı'}</div>
                  <div><strong>Katalog No:</strong> #BLU-{game.id?.slice(0, 8).toUpperCase() || '7729'}</div>
                  <div><strong>Medya:</strong> Çift Katmanlı Blu-ray (50GB)</div>
                </div>
              </div>
            </div>
          )}

          {currentPage === 1 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: '#2b160b', fontWeight: 800, borderBottom: '1px solid #d4c8b0', paddingBottom: '6px', marginBottom: '14px' }}>
                HİKAYE & GENEL BAKIŞ
              </h2>
              <p style={{ fontSize: '13px', color: '#4d3d2f', lineHeight: 1.7, marginBottom: '18px' }}>
                {game.title}, oyuncuyu benzersiz bir görsel ve işitsel deneyime davet ediyor. Zorlu mücadeleler, derin mekanikler ve akıcı oynanış ile kütüphanenizin en seçkin parçalarından biri.
              </p>

              {game.headerUrl && (
                <div style={{ width: '100%', height: '170px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cfbe9e', marginBottom: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                  <img src={game.headerUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', backgroundColor: '#e4d6bf', padding: '4px 8px', borderRadius: '4px', color: '#523f2f', fontWeight: 600 }}>✦ Tek Oyunculu & Çevrimiçi</span>
                <span style={{ fontSize: '11px', backgroundColor: '#e4d6bf', padding: '4px 8px', borderRadius: '4px', color: '#523f2f', fontWeight: 600 }}>✦ 60+ FPS Yüksek Çözünürlük</span>
                <span style={{ fontSize: '11px', backgroundColor: '#e4d6bf', padding: '4px 8px', borderRadius: '4px', color: '#523f2f', fontWeight: 600 }}>✦ Bulut Eşitleme (Cloud Save)</span>
              </div>
            </div>
          )}

          {currentPage === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Gamepad2 size={20} color="#7c4a1e" />
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: '#2b160b', fontWeight: 800, margin: 0 }}>
                  KONTROL ŞEMASI (STANDART DİZİLİM)
                </h2>
              </div>
              <p style={{ fontSize: '12px', color: '#685444', marginBottom: '16px' }}>
                Aşağıda bu oyun için varsayılan klavye & fare ve kontrolcü tuş atamaları listelenmiştir:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #d4c8b0' }}>
                  <div style={{ fontWeight: 800, fontSize: '12px', color: '#2b160b', marginBottom: '8px' }}>⌨️ Klavye & Fare</div>
                  <div style={{ fontSize: '11px', lineHeight: 2, color: '#4d3d2f' }}>
                    <div><strong>W, A, S, D:</strong> Karakter Hareketi</div>
                    <div><strong>Mouse Sol Tık:</strong> Ana Aksiyon / Saldırı</div>
                    <div><strong>Mouse Sağ Tık:</strong> Nişan Alma / İkincil</div>
                    <div><strong>Space:</strong> Zıplama / Atılma</div>
                    <div><strong>Shift:</strong> Koşma / Depar</div>
                    <div><strong>E / F:</strong> Etkileşime Gir / İncele</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #d4c8b0' }}>
                  <div style={{ fontWeight: 800, fontSize: '12px', color: '#2b160b', marginBottom: '8px' }}>🎮 Gamepad (DualShock / Xbox)</div>
                  <div style={{ fontSize: '11px', lineHeight: 2, color: '#4d3d2f' }}>
                    <div><strong>Sol Analog:</strong> Hareket</div>
                    <div><strong>Sağ Analog:</strong> Kamera Açısı</div>
                    <div><strong>R2 / RT:</strong> Birincil Eylem / Ateş</div>
                    <div><strong>L2 / LT:</strong> Hedefe Odaklanma</div>
                    <div><strong>X / A Tuşu:</strong> Onay & Zıplama</div>
                    <div><strong>Start / Menü:</strong> Duraklat</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentPage === 3 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <ShieldCheck size={20} color="#7c4a1e" />
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: '#2b160b', fontWeight: 800, margin: 0 }}>
                  DİSK GÜVENLİĞİ & RESMİ GARANTİ
                </h2>
              </div>

              <div style={{ fontSize: '12px', color: '#4e3d2c', lineHeight: 1.6, marginBottom: '16px', backgroundColor: 'rgba(230, 218, 195, 0.4)', padding: '12px', borderRadius: '6px', border: '1px solid #d4c8b0' }}>
                <p style={{ margin: 0 }}>
                  <strong>Optik Disk Bakımı:</strong> Diskin alt ayna yüzeyine parmakla dokunmayınız. Temizlik için sadece tüy bırakmayan kuru mikrofiber bez kullanınız. Diski doğrudan güneş ışığından ve yüksek ısı kaynaklarından koruyunuz.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', padding: '16px', backgroundColor: '#fff', borderRadius: '6px', border: '1px dashed #bba98a' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#2b160b' }}>ORİJİNAL LİSANSLI ÜRÜN</div>
                  <div style={{ fontSize: '10px', color: '#7a6855', marginTop: '2px' }}>Tüm hakları ilgili stüdyo ve yayıncıya aittir.</div>
                </div>
                {/* Fake Barcode */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ letterSpacing: '3px', fontWeight: 900, fontFamily: 'monospace', fontSize: '14px', color: '#111' }}>
                    ||||| | |||| ||| || ||||
                  </div>
                  <span style={{ fontSize: '9px', color: '#666', fontFamily: 'monospace' }}>5030932087412</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div
          style={{
            padding: '10px 24px 12px 48px',
            borderTop: '1px solid #dfd3be',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(235, 225, 205, 0.4)',
          }}
        >
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid #c8b99d',
              backgroundColor: currentPage === 0 ? 'transparent' : '#e6dac3',
              color: currentPage === 0 ? '#b8a88f' : '#3d2b1d',
              fontWeight: 700,
              fontSize: '12px',
              cursor: currentPage === 0 ? 'default' : 'pointer',
            }}
          >
            <ChevronLeft size={16} /> Önceki Sayfa
          </button>

          {/* Dots Indicator */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <div
                key={idx}
                onClick={() => {
                  soundFX.playPageTurn();
                  setCurrentPage(idx);
                }}
                style={{
                  width: idx === currentPage ? '18px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: idx === currentPage ? '#7c4a1e' : '#c9ba9e',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === totalPages - 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid #c8b99d',
              backgroundColor: currentPage === totalPages - 1 ? 'transparent' : '#e6dac3',
              color: currentPage === totalPages - 1 ? '#b8a88f' : '#3d2b1d',
              fontWeight: 700,
              fontSize: '12px',
              cursor: currentPage === totalPages - 1 ? 'default' : 'pointer',
            }}
          >
            Sonraki Sayfa <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
