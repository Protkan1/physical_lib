# Physical Game Shelf (Nostalgic Bookshelf Edition) 🎮📚

Bu proje; bilgisayarınızda (Windows) yüklü olan tüm oyunları otomatik olarak algılayıp, eski nostaljik **iOS 7 iBooks** ahşap kitaplık raflarına birer fiziksel DVD/kutulu oyun gibi dizen ve üzerlerine tıklandığında **orijinal yarı saydam PlayStation 4 mavi kutusunu** açıp diskiyle etkileşime girmenizi sağlayan bir masaüstü uygulamasıdır.

---

## 🚀 Proje Mimarisi ve Kullanılan Teknolojiler

- **Masaüstü Motoru:** [Electron](https://www.electronjs.org/) (Windows yerel dosya ve süreç entegrasyonu)
- **Kullanıcı Arayüzü:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Stil & 3D Skeuomorfizm:** Saf Vanilla CSS + 3D Perspektif + Donanım Hızlandırmalı CSS Transformasyonları
- **Sistem Tarama Altyapısı:** Node.js `fs`, Windows Registry, Steam ACF Manifest ayrıştırıcı, Epic Games Item manifests, XboxGames dizini

---

## ✨ Hayata Geçirilen Temel Özellikler

### 1. 🔍 Otomatik Oyun & Akıllı Kapak Doğrulama Motoru (`electron/gameScanner.js`)
- **Steam Kütüphaneleri:** `libraryfolders.vdf` ve tüm sürücülerdeki (`C:`, `D:`, `E:`) `appmanifest_*.acf` dosyalarını ayrıştırır.
- **Akıllı Kapak Doğrulama (Artwork Verification & Fallback):**
  - **Call of Duty: Modern Warfare II:** Paket ID'si yerine resmi oyun kapağı olan `1938090` dikey görseline bağlandı.
  - **Jujutsu Kaisen:** Kapağı eksik olan mobil/Steam istemcisi yerine resmi `1877020` kutu görseline bağlandı.
  - **EA SPORTS FC™ 26:** Steam CDN üzerinde doğrudan dikey görseli bulunmayan bu oyun, resmi EA Sports FC ana kütüphane kapak görseline (`2669320`) bağlandı.
  - **How to Fish:** Resmi balıkçılık simülasyonu yüksek çözünürlüklü dikey kapak görseline (`1408610`) bağlandı.
  - **Epic Games:** *Wreckfest* ve *Clone Drone in the Danger Zone* dikey kapakları otomatik çekildi.
- **Masaüstünden Sürükle & Bırak:** Masaüstündeki veya herhangi bir klasördeki oyun kısayollarını (`.url`, `.lnk`, `.exe`) pencereye sürükleyip bıraktığınızda oyun rafa eklenir ve kapağı otomatik bulunur.

### 2. 🔇 Temiz Terminal & Kesin Önbellek İzolasyonu (`electron/main.js`)
- **Hatanın Kaynağı:** Electron varsayılan olarak `AppData\Roaming\Electron` klasörünü kullanıyordu ve burada Windows'un arka plandaki Dawn/Graphite GPU motoru bir önceki süreçle kilitleniyordu.
- **Kalıcı Çözüm:** 
  - `app.name = 'PhysicalGameShelf'` tanımı en başa alındı; uygulama artık genel `Electron` klasörünü değil, kendine ait izole `AppData\Roaming\PhysicalGameShelf` dizinini kullanıyor.
  - Varsa önceki süreçlerden kilitli kalmış olan `Electron/GPUPersistentCache` dizini otomatik temizleniyor.
  - `disable-gpu-shader-disk-cache`, `disable-gpu-program-cache` ve `disable-http-cache` bayraklarıyla gereksiz disk kilitlenmeleri susturuldu. Terminal tamamen temizdir.

### 3. 🪵 Nostaljik iOS 7 Ahşap Raf Tasarımı (`ShelfRow.jsx`, `index.css`)
- **3D Masif Ahşap Raflar:** Derinlikli üst plaka, pahlı ön gövde, pirinç raf isimliği ve gölge efektleri.
- **Yan Yana Raf Dizilimi:** Oyunlar dikey değil, gerçek bir kütüphane gibi yatay dizilir ve dikey fare tekerleğiyle sayfalar arasında rahatça kaydırılabilir.
- **Sürükle & Bırak Düzenleme (Drag & Drop):** Oyunları istediğiniz raftan diğerine taşıyabilir, kendi zevkinize göre sıralayabilirsiniz. Sıralama `localStorage` üzerinde saklanır.
- **Platform Filtreleme:** Üst kısımdaki *Tümü, Steam, Epic, Xbox* butonları ile sadece ilgili platformdaki oyunlar filtrelenebilir.

### 4. 💿 Orijinal PS4 Kutusu & 3D Çift Taraflı Blu-ray Disk (`GameModal.jsx`)
- **Açılma & Kapanma Animasyonu:** Kutu açılırken 3D perspektifle ekrana doğru gelir ve sol kapak gerçekçi bir menteşe açısıyla yana yatar. Kapatıldığında ise yumuşak bir şekilde katlanarak kapanır.
- **Sol Kapak:** Beyaz kuşe kağıttan basılmış **Garanti ve Güvenlik Bilgileri** kitapçığı ve şeffaf plastik tutucu klipsler.
- **Sağ Kapak & Resmi Spindle Yuvası:** Diskin orijinal kovan yuvası ve kar tanesi desenli orta göbeği.
- **Çift Taraflı Blu-ray Disk (Double-Sided 3D Mesh):**
  - **Ön Yüz:** Oyunun kapak resmi, optik hologram yansıması ve PlayStation®4 logosu.
  - **Arka Yüz (360° Çevrildiğinde):** Gerçek bir Blu-ray diskin ayna veri izleri (`mirror data grooves`), barkod matriksi ve lazer seri numarası.

### 5. 🧲 Apple MagSafe Tarzı Manyetik Çekim & Çift Tık Etkileşimi
- **Sol Tık ile Serbest Taşıma:** Diski farenin sol tuşuyla tutarak yuvasından çıkarabilir ve ekranın herhangi bir yerine serbestçe taşıyabilirsiniz.
- **MagSafe Manyetik Çekim (Snap-In):** Disk sağdaki yuvasına (spindle) yaklaştırıldığında mıknatıs kuvveti diski yumuşakça merkeze çeker, açısını düzleştirir ve bırakıldığında mekanik akustik "çıt" sesiyle yuvaya kilitlenir.
- **Sağ Tık ile 360° İnceleme:** Diski farenin sağ tuşuna basılı tutarak 360 derece serbestçe evirip çevirebilir, arka yüzeyindeki veri izlerini inceleyebilirsiniz.
- **Diski Tak & Oyna Butonu:** Kutunun içindeki buton ile Steam veya yerel oyun tek tıkla çalıştırılır.

### 6. 🎨 Raf Tipografisi & Temiz Görsel Düzenleme (`GameCard.jsx`)
- **Çift Başlık Karmaşasının Giderilmesi:** Fiziksel kutunun kendi alt etiketinde (kutu gövdesinde) zaten oyunun ismi ve favori ikonu yer almaktaydı. Ahşap tablanın altına taşan ikinci metin etiketi kaldırılarak rafların tamamen temiz, gerçekçi bir vitrin görünümüne kavuşması sağlandı.

### 7. 🎯 Raf İçi Sürükle-Bırak & Harici Dosya Ayrımı (`App.jsx`, `ShelfRow.jsx`, `GameCard.jsx`)
- **Ekran Kilitlenme Sorununun Çözümü:** Raf içindeki bir oyunun yeri değiştirilmek istendiğinde HTML5 Drag olayı pencere geneline yayılarak "Oyunu Rafa Bırakın" tam ekran dosya bırakma katmanını tetikliyor ve ekranın kilitlenmesine neden oluyordu.
- **İzole Sürükleme Mantığı:** 
  - Tam ekran dosya bırakma katmanı sadece pencere dışından Windows masaüstünden bırakılan gerçek dosyalar (`Files`) için tetiklenecek şekilde sınırlandırıldı.
  - Raf içi oyun taşıma mekanizması raf ID'si ve oyun ID'si üzerinden doğrudan, güvenilir ve animasyonlu bir şekilde yeniden sıralama yapacak hale getirildi.
  - `onDragEnd` olayı eklenerek sürükleme tamamlandığında veya iptal edildiğinde ekran durumunun anında sıfırlanması sağlandı.

### 8. 🖼️ Özel Uygulama Simgesi & Markalama (`src/icon.jpg`)
- **Pencere & Görev Çubuğu Simgesi:** Electron `BrowserWindow` nesnesine `src/icon.jpg` tanımlandı; böylece Windows pencere çubuğu ve görev çubuğunda (taskbar) projenin özel logo arması görüntülendi.
- **HTML Favicon:** `index.html` başlığına `<link rel="icon" type="image/jpeg" href="/src/icon.jpg" />` eklendi.
- **Uygulama Başlık Amblemi:** Arayüzün sol üst köşesindeki standart konsol ikonu yerine altın çerçeveli ve gölgeli `icon.jpg` logosu yerleştirildi.

### 9. 🚀 Büyük 7'li Özellik Paketi (Ultimate Retro Update)
1. **🔊 Nostaljik Web Audio API Ses Efektleri Motoru (`soundFX.js`):**
   - Sıfır gecikmeli; ahşap raf sürtünmesi (`wood slide`), kutu açma/kapama çıt sesleri (`case snap open/close`), spindle yay sesi ve MagSafe akustik bas çekim sesi sentezlendi.
   - Üst bardan tek tıkla sesleri açıp/kapatma (Mute/Unmute) anahtarı.
2. **📖 Gerçekçi Sayfa Çevirmeli Oyun Kılavuzu & Kitapçığı (`GameManualModal.jsx`):**
   - Kutunun sol kapağındaki garanti/kılavuz kağıdına tıklandığında açılan, 4 sayfalık resmi oyun kitapçığı.
   - Sayfa çevirme animasyonu ve sesleri, klavye/fare ve Gamepad tuş şemaları, disk bakım talimatları ve barkod künyesi.
3. **🎨 Kutu Formatı ve Kasa Teması Seçici (`GameModal.jsx`):**
   - Kutu açıldığında sağ üstteki düğmelerden **PS4 Mavi**, **Xbox Yeşil** veya fırçalanmış **Steelbook Metal** kasa temaları arasında anında geçiş imkanı.
4. **🪵 Ahşap Raf Malzemesi & Oda Atmosferi (Lighting / Ambience):**
   - 4 farklı ahşap dokusu: *Ceviz Ağacı*, *Kızıl Maun*, *Açık Meşe*, *Siyah Lake*.
   - 4 oda aydınlatması modu: *Varsayılan*, *Şömine Ateşi*, *Gece Lambası*, *RGB Vitrin Işığı*.
5. **⏱️ Kutu Üzerine Çıkartmalar & Koleksiyoncu Rozetleri (`GameCard.jsx`):**
   - Kutu kapaklarına parıldayan altın *"★ FAVORİ"* hologram çıkartması ve nostaljik *"18+"* PEGI yaş derecelendirme amblemleri eklendi.
6. **🔍 Hızlı Arama & Sanal Lazer Barkod Okuyucu (`ScanBarcode`):**
   - Üst bardaki *"Barkod Okut"* butonuyla tüm ekrandan geçen kırmızı kızılötesi lazer çizgisi ve "BİP!" sesiyle raftaki bir oyunu tarayıp vitrine getiren interaktif simülasyon.
7. **🏷️ Akıllı Raf Dizilimi (Smart Sorting):**
   - Tek tıkla *"A'dan Z'ye Sırala"* ve *"Platforma Göre Diz"* seçenekleri sunan akıllı düzenleme menüsü.

### 10. 💎 İnce Ayar & Gerçekçilik İyileştirmeleri (Fidelity Polish)
- **Kitapçık Tıklama & Kapanma Hatasının Çözümü (`GameManualModal.jsx`):**
  - "Sonraki Sayfa / Önceki Sayfa" butonlarına veya sayfa noktalarına tıklandığında olayın ana kutu arka planına (`backdrop`) sıçrayarak modalı anında kapatması `e.stopPropagation()` ve `zIndex: 200` yalıtımı ile tamamen çözüldü. Sayfalar artık kesintisiz çevriliyor.
- **Gerçekçi Ahşap Doku ve Duvar Çizgileri (`index.css`):**
  - Sadece renk değişimi hissi yerine; her ahşap türü için gerçek panel çizgileri (`wall-pattern repeating-linear-gradient`), pah kenarlıkları, derinlik gölgeleri ve ahşaba özel pirinç isimlik renkleri (`--brass-plate-bg`) uygulandı.
- **Özel Kasa Geometrisi ve İç Yapı Farkları (`GameModal.jsx`):**
  - **PS4:** Standart kuşe kağıt garanti föyü, şeffaf polikarbon klipsler, çift halkalı spindle tepsisi.
  - **Xbox Series:** Canlı neon yeşili yarı saydam kasa, Xbox Velocity lisans metinleri ve yeşil çekim parıltısı.
  - **Steelbook Metal:** Fırçalanmış mat antrasit metal kaplama, metalik perçin klipsler, fasetli koleksiyoncu kitapçığı ve koyu karbon spindle göbeği.

### 11. 📦 Kapalı Kutu Setup (.exe) Paketleme & Kod Koruması (ASAR)
- **Kapalı Kutu Mimarisi:** Projenin tüm JavaScript, React ve Electron kaynak kodları `asar: true` bayrağı ile tek bir şifreli/arşivlenmiş binary paketine gömülmüştür. Dosya sisteminde kullanıcılar açık kodları göremez veya kurcalayamaz.
- **Windows NSIS Kurulum Sihirbazı:** Masaüstü kısayolu, Başlat menüsü entegrasyonu, özel simgesi (`icon.ico`) ve kaldırma yardımcısı (`Uninstall`) içeren tek parça profesyonel Windows Setup dosyasını (`release/Physical Game Shelf Setup 1.0.0.exe`) üretir.
- **Paketleme Komutu:**
  ```bash
  npm run dist
  ```

---

## 🛠️ Nasıl Çalıştırılır ve Paketlenir?

1. Geliştirici modunda çalıştırmak için:
   ```bash
   npm start
   ```

2. Dağıtılabilir kapalı kutu Setup (.exe) oluşturmak için:
   ```bash
   npm run dist
   ```
   *(Oluşan kurulum dosyası `release/` klasörü altına kaydedilir.)*

*(Son Güncelleme: 21 Ekim 2026 - Kapalı kutu ASAR paketleme ve NSIS Setup derleme altyapısı tamamlandı.)*

