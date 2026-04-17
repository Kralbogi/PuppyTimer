import { useEffect, useState } from "react";
import {
  Loader2,
  Shield,
  ShieldOff,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import {
  tumKullanicilariGetir,
  kullaniciCezaGetir,
  kullaniciSikayetSayisiGetir,
  kullaniciyaBanUygula,
  type KullaniciRumuz,
} from "../../../services/adminService";
import type { KullaniciCeza } from "../../../types/models";

type BanTuru = "toplulukEngelli" | "sohbetEngelli" | "fotografKaldirildi";

interface KullaniciDetay {
  ceza: KullaniciCeza | null;
  sikayetSayisi: number;
  yukleniyor: boolean;
}

export default function KullanicilarTab() {
  const [kullanicilar, setKullanicilar] = useState<KullaniciRumuz[]>([]);
  const [filtrelenmis, setFiltrelenmis] = useState<KullaniciRumuz[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [arama, setArama] = useState("");
  const [acikUid, setAcikUid] = useState<string | null>(null);
  const [detaylar, setDetaylar] = useState<Record<string, KullaniciDetay>>({});

  useEffect(() => {
    tumKullanicilariGetir()
      .then((liste) => {
        setKullanicilar(liste);
        setFiltrelenmis(liste);
      })
      .finally(() => setYukleniyor(false));
  }, []);

  useEffect(() => {
    const q = arama.toLowerCase().trim();
    if (!q) {
      setFiltrelenmis(kullanicilar);
    } else {
      setFiltrelenmis(
        kullanicilar.filter(
          (k) =>
            k.displayName.toLowerCase().includes(q) ||
            k.uid.toLowerCase().includes(q)
        )
      );
    }
  }, [arama, kullanicilar]);

  const handleAc = async (uid: string) => {
    if (acikUid === uid) {
      setAcikUid(null);
      return;
    }
    setAcikUid(uid);
    if (detaylar[uid]) return;

    setDetaylar((prev) => ({
      ...prev,
      [uid]: { ceza: null, sikayetSayisi: 0, yukleniyor: true },
    }));

    const [ceza, sikayetSayisi] = await Promise.all([
      kullaniciCezaGetir(uid),
      kullaniciSikayetSayisiGetir(uid),
    ]);

    setDetaylar((prev) => ({
      ...prev,
      [uid]: { ceza, sikayetSayisi, yukleniyor: false },
    }));
  };

  const handleBanToggle = async (uid: string, banTuru: BanTuru, mevcutDeger: boolean) => {
    await kullaniciyaBanUygula(uid, banTuru, !mevcutDeger);
    const [ceza, sikayetSayisi] = await Promise.all([
      kullaniciCezaGetir(uid),
      kullaniciSikayetSayisiGetir(uid),
    ]);
    setDetaylar((prev) => ({
      ...prev,
      [uid]: { ceza, sikayetSayisi, yukleniyor: false },
    }));
  };

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  const BAN_TURLERI: { key: BanTuru; label: string }[] = [
    { key: "toplulukEngelli", label: "Topluluk Engeli" },
    { key: "sohbetEngelli", label: "Sohbet Engeli" },
    { key: "fotografKaldirildi", label: "Fotoğraf Kaldırma" },
  ];

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-600">
          Kullanıcılar ({filtrelenmis.length}/{kullanicilar.length})
        </h2>
      </div>

      {/* Arama */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="İsim veya UID ile ara..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
        />
      </div>

      {filtrelenmis.map((k) => {
        const isAcik = acikUid === k.uid;
        const d = detaylar[k.uid];
        const ceza = d?.ceza;
        const isBanli = ceza?.toplulukEngelli || ceza?.sohbetEngelli || false;

        return (
          <div
            key={k.uid}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <button
              className="w-full px-4 py-3.5 flex items-center justify-between gap-3"
              onClick={() => handleAc(k.uid)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isBanli ? "bg-red-100" : "bg-gray-100"
                  }`}
                >
                  {isBanli ? (
                    <ShieldOff size={16} className="text-red-500" />
                  ) : (
                    <Shield size={16} className="text-gray-400" />
                  )}
                </div>
                <div className="text-left min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {k.displayName}
                  </p>
                  <p className="text-xs text-gray-400 font-mono truncate">{k.uid}</p>
                </div>
              </div>
              {isAcik ? (
                <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
              )}
            </button>

            {isAcik && (
              <div className="border-t border-gray-100 px-4 py-4 space-y-3">
                {d?.yukleniyor ? (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Loader2 size={14} className="animate-spin" />
                    Yükleniyor...
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">
                      Toplam şikayet alındı:{" "}
                      <span className="font-bold text-gray-900">{d?.sikayetSayisi ?? 0}</span>
                    </p>

                    <div className="space-y-2">
                      {BAN_TURLERI.map(({ key, label }) => {
                        const aktif = ceza ? (ceza[key] as boolean) : false;
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{label}</span>
                            <button
                              onClick={() => handleBanToggle(k.uid, key, aktif)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                aktif
                                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              }`}
                            >
                              {aktif ? "Aktif — Kaldır" : "Pasif — Uygula"}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {ceza && (
                      <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-xs text-gray-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Hakaret:</span>
                          <span className="font-medium">{ceza.hakaretSayisi}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Spam:</span>
                          <span className="font-medium">{ceza.spamSayisi}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Uygunsuz görsel:</span>
                          <span className="font-medium">{ceza.uygunsuzGorselSayisi}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {filtrelenmis.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">
          Kullanıcı bulunamadı.
        </div>
      )}
    </div>
  );
}
