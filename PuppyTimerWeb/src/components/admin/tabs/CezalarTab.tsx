import { useEffect, useState } from "react";
import { Loader2, ShieldOff, Shield } from "lucide-react";
import {
  tumCezalariGetir,
  kullaniciyaBanUygula,
} from "../../../services/adminService";
import type { KullaniciCeza } from "../../../types/models";

type BanTuru = "toplulukEngelli" | "sohbetEngelli" | "fotografKaldirildi";

const BAN_TURLERI: { key: BanTuru; label: string }[] = [
  { key: "toplulukEngelli", label: "Topluluk Engeli" },
  { key: "sohbetEngelli", label: "Sohbet Engeli" },
  { key: "fotografKaldirildi", label: "Fotoğraf Kaldırma" },
];

export default function CezalarTab() {
  const [cezalar, setCezalar] = useState<KullaniciCeza[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    tumCezalariGetir()
      .then(setCezalar)
      .finally(() => setYukleniyor(false));
  }, []);

  const handleToggle = async (uid: string, banTuru: BanTuru, mevcutDeger: boolean) => {
    await kullaniciyaBanUygula(uid, banTuru, !mevcutDeger);
    setCezalar((prev) =>
      prev.map((c) =>
        c.id === uid
          ? { ...c, [banTuru]: !mevcutDeger, sonGuncellemeTarihi: Date.now() }
          : c
      )
    );
  };

  if (yukleniyor) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={28} />
      </div>
    );
  }

  const aktifCezalar = cezalar.filter(
    (c) => c.toplulukEngelli || c.sohbetEngelli || c.fotografKaldirildi
  );

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-600">
          Aktif Cezalar: {aktifCezalar.length} / Toplam: {cezalar.length}
        </h2>
      </div>

      {cezalar.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <Shield size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Hiç ceza kaydı yok.</p>
        </div>
      )}

      {cezalar.map((c) => {
        const herhangiBanliMi =
          c.toplulukEngelli || c.sohbetEngelli || c.fotografKaldirildi;
        return (
          <div
            key={c.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Başlık */}
            <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-50">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  herhangiBanliMi ? "bg-red-100" : "bg-gray-100"
                }`}
              >
                {herhangiBanliMi ? (
                  <ShieldOff size={16} className="text-red-500" />
                ) : (
                  <Shield size={16} className="text-gray-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono text-gray-700 truncate">{c.id}</p>
                <p className="text-xs text-gray-400">
                  Toplam şikayet: {c.toplamSikayetSayisi}
                  {" · "}
                  Hakaret: {c.hakaretSayisi}
                  {" · "}
                  Spam: {c.spamSayisi}
                </p>
              </div>
            </div>

            {/* Ban toggles */}
            <div className="px-4 py-3 space-y-2.5">
              {BAN_TURLERI.map(({ key, label }) => {
                const aktif = c[key] as boolean;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{label}</span>
                    <button
                      onClick={() => handleToggle(c.id, key, aktif)}
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
          </div>
        );
      })}
    </div>
  );
}
