// =============================================================================
// PuppyTimer Web - Zamanlayici Servisi (Singleton)
// ZamanlayiciServisi.swift portu
// setInterval(1000) ile her saniye guncelleme,
// document.visibilitychange ile tab fokus yonetimi,
// subscribe/unsubscribe ile React entegrasyonu.
// =============================================================================

type TimerCallback = (kalanSureler: Map<string, number>) => void;

class ZamanlayiciServisi {
  // Program ID -> hedef tarih (timestamp ms)
  private programlar: Map<string, number> = new Map();

  // Program ID -> kalan saniye
  kalanSureler: Map<string, number> = new Map();

  // Dahili interval
  private intervalId: ReturnType<typeof setInterval> | null = null;

  // Aboneler (React component'leri icin)
  private aboneler: Set<TimerCallback> = new Set();

  // Visibility change handler referansi (temizlik icin)
  private visibilityHandler: (() => void) | null = null;

  constructor() {
    this.visibilityDinle();
  }

  // ---------------------------------------------------------------------------
  // Zamanlayiciyi baslat
  // ---------------------------------------------------------------------------
  basla(): void {
    if (this.intervalId !== null) return; // Zaten calisiyor

    this.intervalId = setInterval(() => {
      this.guncelle();
    }, 1000);

    // Hemen ilk guncellemeyi yap
    this.guncelle();
  }

  // ---------------------------------------------------------------------------
  // Zamanlayiciyi durdur
  // ---------------------------------------------------------------------------
  durdur(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Program kaydet (yeni veya guncelle)
  // ---------------------------------------------------------------------------
  programKaydet(id: string, hedefTarih: number): void {
    this.programlar.set(id, hedefTarih);

    // Zamanlayici calismiyorsa baslat
    if (this.intervalId === null) {
      this.basla();
    }

    // Hemen guncelle
    this.guncelle();
  }

  // ---------------------------------------------------------------------------
  // Program sil
  // ---------------------------------------------------------------------------
  programSil(id: string): void {
    this.programlar.delete(id);
    this.kalanSureler.delete(id);

    // Hic program kalmadiysa zamanlayiciyi durdur
    if (this.programlar.size === 0) {
      this.durdur();
    }

    this.aboneleriBilgilendir();
  }

  // ---------------------------------------------------------------------------
  // Tum programlari temizle
  // ---------------------------------------------------------------------------
  tumunuTemizle(): void {
    this.programlar.clear();
    this.kalanSureler.clear();
    this.durdur();
    this.aboneleriBilgilendir();
  }

  // ---------------------------------------------------------------------------
  // Abone ol (React component'leri icin)
  // ---------------------------------------------------------------------------
  subscribe(callback: TimerCallback): void {
    this.aboneler.add(callback);
  }

  // ---------------------------------------------------------------------------
  // Aboneligi iptal et
  // ---------------------------------------------------------------------------
  unsubscribe(callback: TimerCallback): void {
    this.aboneler.delete(callback);
  }

  // ---------------------------------------------------------------------------
  // Belirli bir program icin kalan sureyi al
  // ---------------------------------------------------------------------------
  kalanSureAl(id: string): number {
    return this.kalanSureler.get(id) ?? 0;
  }

  // ---------------------------------------------------------------------------
  // Aktif program sayisi
  // ---------------------------------------------------------------------------
  get aktifProgramSayisi(): number {
    return this.programlar.size;
  }

  // ---------------------------------------------------------------------------
  // Servisi tamamen yok et (cleanup)
  // ---------------------------------------------------------------------------
  destroy(): void {
    this.durdur();
    this.programlar.clear();
    this.kalanSureler.clear();
    this.aboneler.clear();

    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Dahili: Tum programlarin kalan surelerini guncelle
  // ---------------------------------------------------------------------------
  private guncelle(): void {
    const simdi = Date.now();

    for (const [id, hedefTarih] of this.programlar) {
      const kalanMs = hedefTarih - simdi;
      const kalanSaniye = Math.max(Math.floor(kalanMs / 1000), 0);
      this.kalanSureler.set(id, kalanSaniye);
    }

    this.aboneleriBilgilendir();
  }

  // ---------------------------------------------------------------------------
  // Dahili: Tum aboneleri bilgilendir
  // ---------------------------------------------------------------------------
  private aboneleriBilgilendir(): void {
    for (const callback of this.aboneler) {
      try {
        callback(this.kalanSureler);
      } catch (e) {
        console.error("[ZamanlayiciServisi] Abone callback hatasi:", e);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Dahili: Sayfa gorunurlugu degistiginde yeniden hesapla
  // Tab arka plana gidip geri geldiginde zamanlayici dogru kalsin
  // ---------------------------------------------------------------------------
  private visibilityDinle(): void {
    this.visibilityHandler = () => {
      if (document.visibilityState === "visible" && this.programlar.size > 0) {
        this.guncelle();

        // Interval durmussa yeniden baslat
        if (this.intervalId === null) {
          this.basla();
        }
      }
    };

    document.addEventListener("visibilitychange", this.visibilityHandler);
  }
}

// -----------------------------------------------------------------------------
// Singleton instance
// -----------------------------------------------------------------------------
export const zamanlayiciServisi = new ZamanlayiciServisi();
