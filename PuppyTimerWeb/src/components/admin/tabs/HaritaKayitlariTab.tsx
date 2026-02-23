import { useEffect, useState } from "react";
import {
  PawPrint,
  Map,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
} from "lucide-react";
import {
  toplulukKopekleriSayfaGetir,
  tumBolgeleriGetir,
  toplulukKopekAktifToggle,
  toplulukBolgeAktifToggle,
  toplulukKopekSil,
  toplulukBolgeSil,
} from "../../../services/adminService";
import type { ToplulukKopek, ToplulukBolge } from "../../../types/models";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

type SubTab = "kopekler" | "bolgeler";

export default function HaritaKayitlariTab() {
  const [subTab, setSubTab] = useState<SubTab>("kopekler");

  // Köpekler state
  const [kopekler, setKopekler] = useState<ToplulukKopek[]>([]);
  const [kopekSonDoc, setKopekSonDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [kopekYukleniyor, setKopekYukleniyor] = useState(true);
  const [dahaBekliyor, setDahaBekliyor] = useState(false);

  // Bölgeler state
  const [bolgeler, setBolgeler] = useState<ToplulukBolge[]>([]);
  const [bolgeYukleniyor, setBolgeYukleniyor] = useState(false);
  const [bolgeYuklendi, setBolgeYuklendi] = useState(false);

  useEffect(() => {
    toplulukKopekleriSayfaGetir()
      .then(({ items, sonDoc }) => {
        setKopekler(items);
        setKopekSonDoc(sonDoc);
      })
      .finally(() => setKopekYukleniyor(false));
  }, []);

  useEffect(() => {
    if (subTab !== "bolgeler" || bolgeYuklendi) return;
    setBolgeYukleniyor(true);
    tumBolgeleriGetir()
      .then((items) => {
        setBolgeler(items);
        setBolgeYuklendi(true);
      })
      .finally(() => setBolgeYukleniyor(false));
  }, [subTab, bolgeYuklendi]);

  const handleDahaFazla = async () => {
    if (!kopekSonDoc) return;
    setDahaBekliyor(true);
    const { items, sonDoc } = await toplulukKopekleriSayfaGetir(kopekSonDoc);
    setKopekler((prev) => [...prev, ...items]);
    setKopekSonDoc(sonDoc);
    setDahaBekliyor(false);
  };

  const handleKopekToggle = async (id: string, aktif: boolean) => {
    await toplulukKopekAktifToggle(id, !aktif);
    setKopekler((prev) => prev.map((k) => (k.id === id ? { ...k, aktif: !aktif } : k)));
  };

  const handleKopekSil = async (id: string, ad: string) => {
    if (!window.confirm(`"${ad}" köpek kaydını silmek istediğinize emin misiniz?`)) return;
    await toplulukKopekSil(id);
    setKopekler((prev) => prev.filter((k) => k.id !== id));
  };

  const handleBolgeToggle = async (id: string, aktif: boolean) => {
    await toplulukBolgeAktifToggle(id, !aktif);
    setBolgeler((prev) => prev.map((b) => (b.id === id ? { ...b, aktif: !aktif } : b)));
  };

  const handleBolgeSil = async (id: string, baslik: string) => {
    if (!window.confirm(`"${baslik}" bölgesini silmek istediğinize emin misiniz?`)) return;
    await toplulukBolgeSil(id);
    setBolgeler((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      {/* Sub-tab */}
      <div className="flex gap-2 mb-4">
        {(["kopekler", "bolgeler"] as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              subTab === t
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t === "kopekler" ? <PawPrint size={14} /> : <Map size={14} />}
            {t === "kopekler" ? `Köpekler (${kopekler.length})` : `Bölgeler (${bolgeler.length})`}
          </button>
        ))}
      </div>

      {/* Köpekler */}
      {subTab === "kopekler" && (
        <div className="space-y-3">
          {kopekYukleniyor ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-orange-500" size={28} />
            </div>
          ) : kopekler.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">Kayıt bulunamadı.</p>
          ) : (
            kopekler.map((k) => (
              <div
                key={k.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {k.kopekAd}{" "}
                    <span className="font-normal text-gray-500">({k.irk})</span>
                  </p>
                  <p className="text-xs text-gray-400 font-mono truncate">{k.olusturanId}</p>
                  <p className="text-xs text-gray-400">
                    {k.enlem.toFixed(4)}, {k.boylam.toFixed(4)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                        k.aktif
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {k.aktif ? "Aktif" : "Pasif"}
                    </span>
                    <span className="text-xs text-gray-400">❤ {k.toplamBegeniler ?? 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleKopekToggle(k.id, k.aktif)}
                    className={`p-2 rounded-xl transition-colors ${
                      k.aktif
                        ? "bg-green-100 text-green-600 hover:bg-green-200"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    }`}
                    title={k.aktif ? "Pasif yap" : "Aktif yap"}
                  >
                    {k.aktif ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => handleKopekSil(k.id, k.kopekAd)}
                    className="p-2 rounded-xl bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}

          {kopekSonDoc && (
            <button
              onClick={handleDahaFazla}
              disabled={dahaBekliyor}
              className="w-full py-3 flex items-center justify-center gap-2 bg-white rounded-2xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {dahaBekliyor ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ChevronDown size={16} />
              )}
              Daha fazla yükle
            </button>
          )}
        </div>
      )}

      {/* Bölgeler */}
      {subTab === "bolgeler" && (
        <div className="space-y-3">
          {bolgeYukleniyor ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-orange-500" size={28} />
            </div>
          ) : bolgeler.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">Kayıt bulunamadı.</p>
          ) : (
            bolgeler.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{b.baslik}</p>
                  <p className="text-xs text-gray-500">
                    {b.tur} — {b.olusturanAd}
                  </p>
                  <p className="text-xs text-gray-400">
                    {b.enlem.toFixed(4)}, {b.boylam.toFixed(4)}
                  </p>
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                      b.aktif
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {b.aktif ? "Aktif" : "Pasif"}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleBolgeToggle(b.id, b.aktif)}
                    className={`p-2 rounded-xl transition-colors ${
                      b.aktif
                        ? "bg-green-100 text-green-600 hover:bg-green-200"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    }`}
                    title={b.aktif ? "Pasif yap" : "Aktif yap"}
                  >
                    {b.aktif ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => handleBolgeSil(b.id, b.baslik)}
                    className="p-2 rounded-xl bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
