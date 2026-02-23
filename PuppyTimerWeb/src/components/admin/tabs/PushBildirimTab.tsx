import React, { useState, useEffect } from "react";
import {
  Bell,
  Send,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  User,
} from "lucide-react";
import {
  pushBildirimGonder,
  gecmisPushBildirimleriGetir,
  type PushBildirim,
} from "../../../services/adminService";
import { auth } from "../../../services/firebase";

const DURUM_IKONU: Record<string, React.ReactNode> = {
  gonderildi: <CheckCircle size={13} className="text-green-500" />,
  beklemede: <Clock size={13} className="text-yellow-500" />,
  hata: <AlertCircle size={13} className="text-red-500" />,
};

export default function PushBildirimTab() {
  const [baslik, setBaslik] = useState("");
  const [govde, setGovde] = useState("");
  const [url, setUrl] = useState("");
  const [hedef, setHedef] = useState<"hepsi" | "ozel">("hepsi");
  const [hedefUid, setHedefUid] = useState("");
  const [gonderiyor, setGonderiyor] = useState(false);
  const [sonuc, setSonuc] = useState<{ tur: "basari" | "hata"; mesaj: string } | null>(null);
  const [gecmis, setGecmis] = useState<PushBildirim[]>([]);
  const [gecmisYukleniyor, setGecmisYukleniyor] = useState(true);

  useEffect(() => {
    gecmisPushBildirimleriGetir()
      .then(setGecmis)
      .finally(() => setGecmisYukleniyor(false));
  }, []);

  const handleGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baslik.trim() || !govde.trim()) return;
    if (hedef === "ozel" && !hedefUid.trim()) return;

    setGonderiyor(true);
    setSonuc(null);

    try {
      const hedefDeger = hedef === "hepsi" ? "hepsi" : hedefUid.trim();
      await pushBildirimGonder(
        baslik.trim(),
        govde.trim(),
        hedefDeger,
        url.trim() || undefined,
        auth.currentUser?.uid
      );
      setSonuc({
        tur: "basari",
        mesaj: "Bildirim kuyruğa eklendi. Cloud Function birkaç saniye içinde gönderecek.",
      });
      setBaslik("");
      setGovde("");
      setUrl("");
      setHedefUid("");
      const yeniGecmis = await gecmisPushBildirimleriGetir();
      setGecmis(yeniGecmis);
    } catch (err) {
      setSonuc({
        tur: "hata",
        mesaj: err instanceof Error ? err.message : "Gönderilemedi.",
      });
    } finally {
      setGonderiyor(false);
    }
  };

  const gondermeyiEngelleyen =
    gonderiyor ||
    !baslik.trim() ||
    !govde.trim() ||
    (hedef === "ozel" && !hedefUid.trim());

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Bilgi notu */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-start gap-2">
        <Bell size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Bildirimi alan kullanıcının tarayıcısında bildirim izni vermiş ve FCM token'ı kayıtlı olması gerekir.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Bell size={20} className="text-orange-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Push Bildirimi Gönder</h2>
            <p className="text-xs text-gray-500">Firebase Cloud Messaging (FCM)</p>
          </div>
        </div>

        <form onSubmit={handleGonder} className="px-5 py-4 space-y-4">
          {/* Hedef */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hedef</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHedef("hepsi")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  hedef === "hepsi"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Users size={14} />
                Tüm Kullanıcılar
              </button>
              <button
                type="button"
                onClick={() => setHedef("ozel")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  hedef === "ozel"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <User size={14} />
                Belirli Kullanıcı
              </button>
            </div>
          </div>

          {hedef === "ozel" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Kullanıcı UID
              </label>
              <input
                type="text"
                value={hedefUid}
                onChange={(e) => setHedefUid(e.target.value)}
                placeholder="Firebase UID..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Başlık</label>
            <input
              type="text"
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              placeholder="Bildirim başlığı..."
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">İçerik</label>
            <textarea
              value={govde}
              onChange={(e) => setGovde(e.target.value)}
              placeholder="Bildirim içeriği..."
              rows={3}
              maxLength={300}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-0.5">{govde.length}/300</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              URL (Opsiyonel)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://pawland3448.web.app/..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm"
            />
          </div>

          {sonuc && (
            <div
              className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm ${
                sonuc.tur === "basari"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {sonuc.tur === "basari" ? (
                <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              )}
              <span>{sonuc.mesaj}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={gondermeyiEngelleyen}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
          >
            {gonderiyor ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Kuyruğa ekleniyor...
              </>
            ) : (
              <>
                <Send size={16} />
                Gönder
              </>
            )}
          </button>
        </form>
      </div>

      {/* Geçmiş */}
      <div>
        <h3 className="text-sm font-bold text-gray-600 mb-3">Son Gönderimler</h3>
        {gecmisYukleniyor ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-orange-500" size={20} />
          </div>
        ) : gecmis.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Henüz gönderim yok.</p>
        ) : (
          <div className="space-y-2">
            {gecmis.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{g.baslik}</p>
                    <p className="text-xs text-gray-500 truncate">{g.govde}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {g.hedef === "hepsi" ? "Herkese" : `UID: ${g.hedef.substring(0, 12)}...`}
                      {" · "}
                      {new Date(g.tarih).toLocaleString("tr-TR")}
                      {g.gonderilenSayisi !== undefined && (
                        <> · {g.gonderilenSayisi}/{g.toplamToken} gönderildi</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    {DURUM_IKONU[g.durum] || null}
                    <span className="text-xs text-gray-400">{g.durum}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
