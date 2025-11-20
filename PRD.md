## PRD — Interactive Hierarchical Data Visualization (GitHub Repo Tree & Personal Mind Map)

### 1) Özet ve Amaç
- GitHub repo URL’si verildiğinde, repodaki klasör/dosya hiyerarşisini interaktif bir ağaç/mind map olarak görselleştirir.
- Dosya düğümlerine tıklayınca kullanıcıyı ilgili GitHub dosya sayfasına götürür.
- Klasör düğümleri açılıp-kapanabilir, lazy-load ile içerikler sonradan yüklenir.
- Repo URL’si verilmezse kullanıcı kişisel bir ağaç oluşturabilir, sağ tık ile dal/alt dal ekleyebilir, markdown notları tutabilir ve okumak için dalları genişletebilir.

### 2) Kapsam
- Web tabanlı, tek sayfa uygulaması (SPA).
- HTML, CSS, JS ile; D3.js veya benzeri lib ile hiyerarşik görselleştirme.
- GitHub REST API entegrasyonu (public, opsiyonel OAuth ile artırılmış rate limit).
- Kişisel mod verilerinin tarayıcıda saklanması (IndexedDB + localStorage).
- İçe/Dışa aktarım (JSON).
- Masaüstü ve mobil için duyarlı arayüz.

### 3) Kullanıcı Profilleri ve Temel Senaryolar
- Ziyaretçi/Geliştirici: Repo ağacını hızlı keşfetmek, dosyalara atlamak.
- Güç kullanıcı: Büyük repo ağaçlarını filtrelemek, arama yapmak.
- Kişisel not tutan: Kişisel ağaç kurmak, markdown notlar eklemek, paylaşmak.

Senaryolar:
1) Kullanıcı GitHub repo URL’sini girer → kök ağaç görünür → klasör düğümlerini tıklayarak derinlere iner → dosyayı tıklayınca GitHub’da açılır.
2) URL yok → “Kişisel Mod” → boş kanvas → sağ tık “Yaprak Ekle” → başlık, ikon, renk ve Markdown not girer → tıklayınca not genişler.
3) Sağ üst arama → düğüm adında/etikette eşleşen düğümler vurgulanır ve otomatik kaydırılır.
4) Sağa tık menü → “Alt Dal Ekle, Notu Düzenle, Kopyala, Kes/Yapıştır, Sil, Katla, Rengi/İkonu Değiştir”.
5) İçe/Dışa aktar → JSON indir/yükle, link ile paylaş (opsiyonel kısaltılmış URL).

### 4) Başarı Kriterleri (North-star ve Guardrail Metri̇kler)
- Ortalama ilk yükleme < 2.5 sn (repo kökü + ilk katman).
- 10K düğüme kadar etkileşimli performans: 60 FPS hedef, en düşük 30 FPS.
- GitHub rate-limit hatalarında kullanıcıya şeffaf uyarı ve retry.
- Kişisel modda tüm CRUD işlemleri 100 ms altında hissedilen gecikme.
- En az 5 farklı büyük repo ile E2E kabul testi.

### 5) İşlevsel Gereksinimler

#### 5.1 Modlar
- Repo Modu:
  - Girdi: `owner/repo` veya tam URL (`https://github.com/owner/repo`).
  - Varsayılan branch tespiti; kullanıcı branch/tag seçebilir.
  - Ağaç düğümleri: `folder`, `file`, `symlink`, `submodule`.
  - Dosya düğümü tıklaması GitHub dosya sayfasını yeni sekmede açar.
  - Lazy load: Klasör genişletilince `GET /repos/{owner}/{repo}/contents/{path}?ref={branch}`.
  - Büyük klasörlerde sayfalama ve “Daha fazla yükle” desteği (en az 1000 öğeye kadar).
  - Submodule tespiti: hedef repoya git geçiş linki göster.
- Kişisel Mod:
  - Düğüm tipleri: `note`, `group`, `link`, `task` (opsiyonel).
  - Her düğümde başlık, açıklama (Markdown), renk, ikon, etiketler.
  - Sağ tık bağlam menüsü ile CRUD ve düzenleme.
  - Not içerikleri Markdown render (başlıklar, listeler, code, link, görsel).
  - Veriler IndexedDB’de saklanır, son durum otomatik kaydedilir.
  - İçe/Dışa aktar: tek JSON şeması.

#### 5.2 Görselleştirme ve Etkileşim
- Layout: yatay veya radyal ağaç; kullanıcının seçimi (ayarlar).
- Zoom & pan (mouse wheel, pinch, sürükle).
- Düğüm durumları: collapsed/expanded/leaf/active/selected/hover.
- Düğüm boyutları içerik uzunluğuna göre dinamik; yoğunluk için “sıkı” ve “rahat” mod.
- Kenar (edge) stileleri: eğrisel, düz, yönsüz; yoğunlukta kenar demetleme (bundling) opsiyonu.
- Klavye kısayolları:
  - Enter: seçili düğümü aç/kapat
  - A: alt dal ekle
  - Del/Backspace: sil
  - F: arama
  - S: kaydet
  - Ctrl/Cmd + Z/Y: geri/ileri
- Çoklu seçim (Shift/CTRL tıklama), grup taşıma.

#### 5.3 Arama, Filtre ve Vurgu
- Anında arama: başlık, tam yol, etiketlerde substring ve regex.
- Filtreler: tip (dosya/klasör/note), uzantı, boyut aralığı (repo modunda GitHub’dan gelen `size`).
- Vurgu: eşleşen düğümler sarı, yol polilines kalın.
- “Sadece eşleşen yolu göster” geçişi (context için komşuları gizle).

#### 5.4 Bağlam Menüsü (Sağ Tık)
- Alt Dal Ekle
- Notu Düzenle (Markdown editör)
- Yeniden Adlandır
- Kopyala / Kes / Yapıştır
- Rengi/İkonu Değiştir
- Bağlantı Ekle (url)
- Katla/Tümünü Katla-Genişlet
- Sil
- Özellikler (oluşturma tarihi, etiketler, istatistik)

#### 5.5 Paylaşım ve İçe/Dışa Aktarım
- JSON dışa aktar: tam ağaç, layout koordinatları dahil.
- JSON içe aktar: birleştirme veya mevcut projeyi değiştirme.
- Paylaşılabilir bağlantı:
  - Repo modu için: URL parametrelerinde owner/repo/branch + açılmış düğüm yolları.
  - Kişisel mod için: opsiyonel kısaltma servisi ile blob yükleme (MVP dışı).

### 6) Veri Modeli

Düğüm nesnesi (ortak şema):
```json
{
  "id": "uuid",
  "type": "folder|file|note|group|link|submodule",
  "title": "src",
  "path": "src",
  "children": [],
  "expanded": false,
  "meta": {
    "github": {
      "owner": "octocat",
      "repo": "Hello-World",
      "ref": "main",
      "sha": "…",
      "size": 0,
      "html_url": "https://github.com/…"
    },
    "note": {
      "markdown": "## Başlık\nİçerik…"
    },
    "style": {
      "color": "#2dd4bf",
      "icon": "folder"
    },
    "tags": ["frontend","build"]
  }
}
```

### 7) Entegrasyonlar

#### 7.1 GitHub API
- List contents: `GET /repos/{owner}/{repo}/contents/{path}?ref={branch}`
- Default branch: `GET /repos/{owner}/{repo}`
- Rate limit: anonim ~60 request/saat; OAuth token ile ~5000/saat.
- Auth seçeneği: Kullanıcı ayarlardan PAT girer; tarayıcıda sadece `localStorage`’da saklanır.
- Hata durumları: 403 (rate limit), 404 (yol yok), 451, ağ kesintisi → kullanıcıya diyalog + retry/backoff.

#### 7.2 Markdown
- Güvenli render: XSS korumalı, link `rel="noopener noreferrer"`.

### 8) Mimari ve Teknoloji

- UI: Vanilla JS + D3.js (veya dagre-d3) + Web Components veya hafif bir view katmanı.
- State: Tek atomik store (örn. Redux Toolkit benzeri basit store veya RxJS).
- Persist: IndexedDB (ağaç ve notlar), localStorage (ayarlar, token).
- Modüler katmanlar:
  - `githubService`: API çağrıları, caching, hata haritalama.
  - `treeModel`: düğüm CRUD, id üretimi, immutable güncellemeler.
  - `layoutEngine`: radial/horizontal tree hesapları, sanallaştırma.
  - `renderer`: canvas/SVG katmanı, event delegasyonu.
  - `markdown`: sanitize + render.
- Performans:
  - Lazy load ve incremental render.
  - Büyük ağaçlarda canvas tabanlı çizim, label’lar için SVG/HTML overlay.
  - Viewport bazlı sanallaştırma, kenar demetleme opsiyonu.
  - Web Worker ile büyük düzen hesapları (opsiyonel).

### 9) UX/UI Gereksinimleri

- Üst çubuk: repo girişi alanı, branch seçici, arama, ayarlar, mod değiştirici.
- Sol panel (opsiyonel): filtreler, katmanlar, efsane/ikon rehberi.
- Kanvas: koyu/açık tema; 12 px–16 px okunabilir etiketler.
- Düğüm kartı hover’da tooltip; tıklamada detay paneli (Markdown, meta).
- Erişilebilirlik: klavye ile dolaşım, kontrast AA, ARIA roller.
- Dil: TR/EN i18n altyapısı.

### 10) Güvenlik ve Gizlilik
- PAT sadece kullanıcı tarayıcısında kalır; sunucu yoksa persist yalnızca local.
- İçerik güvenliği: CSP önerileri, DOMPurify ile markdown sanitize.
- Telemetri (opsiyonel): anonim kullanım event’leri, açık onay ile.

### 11) Hata Durumları ve Bozucu Kullanım
- Rate limit doldu → sayaç ve “Token ekle” CTA.
- 404 yol → düğüm üzerinde “Bulunamadı”, tekrar dene butonu.
- Ağ kesintisi → offline banner, kişisel mod yine çalışır.
- Parse/JSON içe aktar hatası → doğrulama mesajı.

### 12) Ölçütler ve Kabul Kriterleri

Kritik Kabul Kriterleri:
- Repo URL’si girildiğinde kök + ilk seviye 3 sn altında yüklenir.
- Klasör düğümü tıklandığında içerik lazy-load ile gelir ve UI donmaz.
- Dosya düğümüne tıklamak yeni sekmede doğru GitHub dosya sayfasını açar.
- Kişisel modda sağ tık menüsü ile dal ekleme/silme/yeniden adlandırma çalışır.
- Markdown notu eklenir, güvenli render edilir, tıklayınca genişleyip okunur.
- Arama bulunduğunda sonuçlar vurgulanır ve ilk sonuç ekrana getirilir.
- JSON dışa aktar/İçe aktar ile aynı ağaç geri yüklenir.
- 10K düğüm simülasyonunda UI etkileşimleri akıcıdır (>=30 FPS).

### 13) Yol Haritası ve Milestones

M1 — Temel Repo Ağacı (2 hafta)
- Repo girişi, default branch alma, kök+ilk seviye render
- Genişlet/kapat, dosya tıkla→GitHub
- Basit zoom/pan, koyu/açık tema

M2 — Lazy Load ve Performans (2 hafta)
- Derin klasör lazy-load, hata yönetimi
- Canvas/SVG hibrit render, temel sanallaştırma

M3 — Arama/Filtre ve UI İyileştirmeleri (1.5 hafta)
- Anında arama, filtreler, vurgulama
- Düğüm detay paneli, kısayollar

M4 — Kişisel Mod ve Markdown Notlar (2 hafta)
- Sağ tık menüsü ile CRUD
- Markdown editör + render, IndexedDB persist
- JSON içe/dışa aktar

M5 — OAuth/Token ve Gelişmiş Özellikler (1 hafta)
- PAT girişi, rate-limit göstergesi
- Submodule desteği, ikon/renk özelleştirme

### 14) Test Planı
- Birim test: `treeModel`, `githubService`, `markdown` sanitizer.
- Entegrasyon: Lazy-load akışları, rate-limit ve retry.
- Görsel regresyon: kritik ekranlar (açık/koyu).
- Erişilebilirlik: klavye navigasyonu, kontrast.
- Performans: 1K/5K/10K düğüm senaryoları, FPS ve input latency ölçümü.
- E2E: Cypress/Playwright ile baştan sona senaryolar.

### 15) Riskler ve Önlemler
- GitHub rate limit: Token opsiyonu + caching + exponential backoff.
- Büyük repo performansı: sanallaştırma, worker ile layout, kenar bundling.
- XSS riskleri: katı sanitize ve CSP.
- Mobil kullanılabilirlik: tek parmak pan, çift dokun zoom ve sadelik.

### 16) Açık Sorular
- Submodule derin takibi ne kadar? Varsayılan: link ver, içe açma MVP dışı.
- Paylaşım için backend gerekli mi? MVP: hayır; URL parametreleri ile açılmış yol.
- Ekip işbirliği (çoklu kullanıcı paylaşımı) kapsam dışı mı? MVP: kapsam dışı.

### 17) Ekler

#### 17.1 GitHub İçerik Örneği Dönüşüm Kuralları
- `type=dir` → `folder` düğümü.
- `type=file` → `file` düğümü; `html_url` hedef link.
- `type=submodule` → `submodule`, tooltip’te hedef repo bilgisi.

#### 17.2 JSON İçe/Dışa Aktarım Şema Versiyonlaması
- `schemaVersion`: "1.0"
- Gelecekte kırıcı değişimlerde migration tablosu.

#### 17.3 Minimum Tarayıcı Desteği
- Son 2 Chrome/Edge/Firefox, Safari 16+; mobil iOS 16+, Android 12+.
