// =============================================================================
// PawLand - useSaglikViewModel Hook
// SaglikViewModel'in React karsiligi
// Asi, veteriner ziyareti, ilac takibi ve saglik notu yonetimi
// =============================================================================

import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo } from 'react';
import { db } from '../db/database';
import type { SaglikKategorisi } from '../types/enums';
import type {
  AsiKaydi,
  VeterinerZiyareti,
  IlacTakibi,
  SaglikNotu,
  KiloKaydi,
} from '../types/models';

// 30 gun milisaniye cinsinden
const OTUZ_GUN_MS = 30 * 24 * 3600 * 1000;

export function useSaglikViewModel(kopekId: number) {
  // ---------------------------------------------------------------------------
  // Reactive Queries
  // ---------------------------------------------------------------------------

  const asilar = useLiveQuery(
    () =>
      db.asiKayitlari
        .where('kopekId')
        .equals(kopekId)
        .toArray()
        .then((items) => items.sort((a, b) => b.tarih - a.tarih)),
    [kopekId],
    []
  );

  const ziyaretler = useLiveQuery(
    () =>
      db.veterinerZiyaretleri
        .where('kopekId')
        .equals(kopekId)
        .toArray()
        .then((items) => items.sort((a, b) => b.tarih - a.tarih)),
    [kopekId],
    []
  );

  const ilaclar = useLiveQuery(
    () =>
      db.ilacTakipleri
        .where('kopekId')
        .equals(kopekId)
        .toArray()
        .then((items) => items.sort((a, b) => a.ilacAdi.localeCompare(b.ilacAdi))),
    [kopekId],
    []
  );

  const notlar = useLiveQuery(
    () =>
      db.saglikNotlari
        .where('kopekId')
        .equals(kopekId)
        .toArray()
        .then((items) => items.sort((a, b) => b.tarih - a.tarih)),
    [kopekId],
    []
  );

  const kiloKayitlari = useLiveQuery(
    () =>
      db.kiloKayitlari
        .where('kopekId')
        .equals(kopekId)
        .toArray()
        .then((items) => items.sort((a, b) => b.tarih - a.tarih)),
    [kopekId],
    []
  );

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const yaklasanAsilar = useMemo(() => {
    const simdi = Date.now();
    return asilar.filter((asi) => {
      if (!asi.sonrakiTarih) return false;
      return asi.sonrakiTarih > simdi && asi.sonrakiTarih - simdi < OTUZ_GUN_MS;
    });
  }, [asilar]);

  const aktifIlaclar = useMemo(
    () => ilaclar.filter((ilac) => ilac.aktif),
    [ilaclar]
  );

  // ---------------------------------------------------------------------------
  // Asi CRUD
  // ---------------------------------------------------------------------------

  const asiEkle = useCallback(
    async (
      asiAdi: string,
      tarih: number,
      sonrakiTarih?: number,
      veterinerAdi?: string,
      not?: string
    ): Promise<number> => {
      const kayit: AsiKaydi = {
        kopekId,
        asiAdi,
        tarih,
        sonrakiTarih,
        veterinerAdi,
        not,
      };
      const id = await db.asiKayitlari.add(kayit);
      return id;
    },
    [kopekId]
  );

  const asiSil = useCallback(async (id: number): Promise<void> => {
    await db.asiKayitlari.delete(id);
  }, []);

  // ---------------------------------------------------------------------------
  // Veteriner Ziyareti CRUD
  // ---------------------------------------------------------------------------

  const ziyaretEkle = useCallback(
    async (
      tarih: number,
      neden: string,
      teshis?: string,
      tedavi?: string,
      veterinerAdi?: string,
      maliyet?: number,
      not?: string,
      veterinerTelefon?: string,
      veterinerEposta?: string,
      klinikAdi?: string,
      klinikAdresi?: string
    ): Promise<number> => {
      const kayit: VeterinerZiyareti = {
        kopekId,
        tarih,
        neden,
        teshis,
        tedavi,
        veterinerAdi,
        veterinerTelefon,
        veterinerEposta,
        klinikAdi,
        klinikAdresi,
        maliyet,
        not,
      };
      const id = await db.veterinerZiyaretleri.add(kayit);
      return id;
    },
    [kopekId]
  );

  const ziyaretSil = useCallback(async (id: number): Promise<void> => {
    await db.veterinerZiyaretleri.delete(id);
  }, []);

  // ---------------------------------------------------------------------------
  // Ilac Takibi CRUD
  // ---------------------------------------------------------------------------

  const ilacEkle = useCallback(
    async (
      ilacAdi: string,
      doz: string,
      baslangicTarihi: number,
      saatAraligi: number,
      bitisTarihi?: number,
      not?: string
    ): Promise<number> => {
      const simdi = Date.now();
      const birSonrakiDoz = simdi + saatAraligi * 3600 * 1000;

      const kayit: IlacTakibi = {
        kopekId,
        ilacAdi,
        doz,
        baslangicTarihi,
        bitisTarihi,
        saatAraligi,
        birSonrakiDoz,
        aktif: true,
        not,
      };
      const id = await db.ilacTakipleri.add(kayit);
      return id;
    },
    [kopekId]
  );

  const ilacDozVerildi = useCallback(
    async (ilacId: number): Promise<void> => {
      const ilac = await db.ilacTakipleri.get(ilacId);
      if (!ilac) return;

      const simdi = Date.now();
      const birSonrakiDoz = simdi + ilac.saatAraligi * 3600 * 1000;

      await db.ilacTakipleri.update(ilacId, {
        sonDoz: simdi,
        birSonrakiDoz,
      });
    },
    []
  );

  const ilacSil = useCallback(async (id: number): Promise<void> => {
    await db.ilacTakipleri.delete(id);
  }, []);

  // ---------------------------------------------------------------------------
  // Saglik Notu CRUD
  // ---------------------------------------------------------------------------

  const notEkle = useCallback(
    async (
      baslik: string,
      icerik: string,
      kategori: SaglikKategorisi
    ): Promise<number> => {
      const kayit: SaglikNotu = {
        kopekId,
        baslik,
        icerik,
        tarih: Date.now(),
        kategori,
      };
      const id = await db.saglikNotlari.add(kayit);
      return id;
    },
    [kopekId]
  );

  const notSil = useCallback(async (id: number): Promise<void> => {
    await db.saglikNotlari.delete(id);
  }, []);

  // ---------------------------------------------------------------------------
  // Kilo Kaydi CRUD
  // ---------------------------------------------------------------------------

  const kiloEkle = useCallback(
    async (agirlik: number, tarih: number, not?: string): Promise<number> => {
      const kayit: KiloKaydi = {
        kopekId,
        agirlik,
        tarih,
        not,
      };
      const id = await db.kiloKayitlari.add(kayit);
      return id;
    },
    [kopekId]
  );

  const kiloSil = useCallback(async (id: number): Promise<void> => {
    await db.kiloKayitlari.delete(id);
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    asilar,
    ziyaretler,
    ilaclar,
    notlar,
    kiloKayitlari,
    yaklasanAsilar,
    aktifIlaclar,
    asiEkle,
    asiSil,
    ziyaretEkle,
    ziyaretSil,
    ilacEkle,
    ilacDozVerildi,
    ilacSil,
    notEkle,
    notSil,
    kiloEkle,
    kiloSil,
  };
}
