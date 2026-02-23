import { useEffect, useState } from "react";
import { Loader2, CheckCircle, Clock } from "lucide-react";
import {
  tumSikayetleriGetir,
  sikayetiIslendiIsaretle,
} from "../../../services/adminService";
import type { Sikayet } from "../../../types/models";

const KATEGORI_RENK: Record<string, string> = {
  hakaret: "bg-red-100 text-red-700",
  spam: "bg-yellow-100 text-yellow-700",
  uygunsuz_gorsel: "bg-purple-100 text-purple-700",
  rahatsizlik: "bg-orange-100 text-orange-700",
};

const KATEGORI_LABEL: Record<string, string> = {
  hakaret: "Hakaret",
  spam: "Spam",
  uygunsuz_gorsel: "Uygunsuz Görsel",
  rahatsizlik: "Rahatsızlık",
};

export default function SikayetlerTab() {
  const [sikayetler, setSikayetler] = useState<Sikayet[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    tumSikayetleriGetir()
      .then(setSikayetler)
      .finally(() => setYukleniyor(false));
  }, []);

  const handleIslendiIsaretle = async (id: string) => {
    await sikayetiIslendiIsaretle(id);
    setSikayetler((prev) =>
      prev.map((s) => (s.id === id ? { ...s, durum: "islendi" as const } : s))
    );
  };

  if (yukleniyor) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={28} />
      </div>
    );
  }

  const beklemede = sikayetler.filter((s) => s.durum !== "islendi");
  const islendi = sikayetler.filter((s) => s.durum === "islendi");

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      {/* Bekleyen */}
      <div>
        <h2 className="text-base font-bold text-gray-600 mb-3">
          Bekleyen Şikayetler ({beklemede.length})
        </h2>
        <div className="space-y-3">
          {beklemede.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Bekleyen şikayet yok.</p>
            </div>
          )}
          {beklemede.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      KATEGORI_RENK[s.kategori] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {KATEGORI_LABEL[s.kategori] || s.kategori}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                    <Clock size={11} />
                    {new Date(s.olusturmaTarihi).toLocaleDateString("tr-TR")}
                  </span>
                </div>
                <div className="space-y-1 mb-2">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Şikayet eden:</span>{" "}
                    {s.sikayetEdenAd}
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Şikayet edilen UID:</span>{" "}
                    <span className="font-mono">{s.sikayetEdilenId.substring(0, 16)}...</span>
                  </p>
                  {s.sikayetEdilenKopekId && (
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Köpek ID:</span>{" "}
                      <span className="font-mono">{s.sikayetEdilenKopekId.substring(0, 16)}...</span>
                    </p>
                  )}
                </div>
                {s.aciklama && (
                  <p className="text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2 italic mb-2">
                    "{s.aciklama}"
                  </p>
                )}
                <button
                  onClick={() => handleIslendiIsaretle(s.id!)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <CheckCircle size={14} />
                  İşlendi Olarak İşaretle
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* İşlenenler */}
      {islendi.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-600 mb-3">
            İşlenenler ({islendi.length})
          </h2>
          <div className="space-y-2">
            {islendi.slice(0, 15).map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 opacity-60"
              >
                <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 truncate">
                    {KATEGORI_LABEL[s.kategori] || s.kategori} — {s.sikayetEdenAd}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(s.olusturmaTarihi).toLocaleDateString("tr-TR")}
                  </p>
                </div>
              </div>
            ))}
            {islendi.length > 15 && (
              <p className="text-xs text-center text-gray-400 py-1">
                +{islendi.length - 15} daha
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
