// =============================================================================
// PuppyTimer Web - Arkadaşlarım Sayfası
// Friends management page with tabs for friends list and requests
// =============================================================================

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  UserMinus,
  Check,
  XCircle,
  UserPlus,
  Circle,
  Search,
  X,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { useArkadasViewModel } from "../hooks/useArkadasViewModel";
import { useKonusmaListesiViewModel } from "../hooks/useKonusmaListesiViewModel";
import { konusmaOlusturVeyaGetir } from "../services/mesajService";
import {
  kullaniciAra,
  type KullaniciAramaSonucu,
} from "../services/arkadasService";
import { MesajPanel } from "../components/community/MesajPanel";
import { auth } from "../services/firebase";

type Tab = "arkadaslar" | "istekler";

// Kısa zaman formatı (iMessage tarzı)
function zamanKisa(tarih: number): string {
  const fark = Date.now() - tarih;
  const dakika = Math.floor(fark / 60000);
  const saat = Math.floor(dakika / 60);
  const gun = Math.floor(saat / 24);

  if (gun > 6) {
    return new Date(tarih).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
    });
  }
  if (gun > 0) return `${gun}g`;
  if (saat > 0) return `${saat}s`;
  if (dakika > 0) return `${dakika}dk`;
  return "Şimdi";
}

export function ArkadaslarimPage() {
  const navigate = useNavigate();
  const arkadasVM = useArkadasViewModel();
  const konusmaVM = useKonusmaListesiViewModel();

  const [aktifTab, setAktifTab] = useState<Tab>("arkadaslar");
  const [secilenKonusma, setSecilenKonusma] = useState<{
    konusmaId: string;
    karsiTarafAd: string;
  } | null>(null);

  // Arkadaş ekle modal state
  const [arkadasEklePaneli, setArkadasEklePaneli] = useState(false);
  const [aramaMetni, setAramaMetni] = useState("");
  const [aramaSonuclari, setAramaSonuclari] = useState<KullaniciAramaSonucu[]>([]);
  const [aramaYukleniyor, setAramaYukleniyor] = useState(false);
  const [istekGonderildi, setIstekGonderildi] = useState<Set<string>>(new Set());

  const handleMesajGonder = async (karsiTarafId: string, karsiTarafAd: string) => {
    try {
      const konusmaId = await konusmaOlusturVeyaGetir(karsiTarafId);
      setSecilenKonusma({ konusmaId, karsiTarafAd });
    } catch (err) {
      console.error("Konusma baslatma hatasi:", err);
      alert("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
    }
  };

  const handleArkadasSil = async (arkadas: any) => {
    const benimUid = auth.currentUser?.uid || arkadasVM.kullaniciId;
    const benGonderdim = arkadas.gonderenId === benimUid;
    const karsiTarafAd = benGonderdim ? arkadas.aliciAd : arkadas.gonderenAd;
    const onay = window.confirm(
      `${karsiTarafAd} ile arkadaşlığı sonlandırmak istediğinizden emin misiniz?`
    );
    if (!onay) return;

    try {
      await arkadasVM.arkadasSil(arkadas.id);
    } catch (err) {
      console.error("Arkadas silme hatasi:", err);
      alert("Arkadaşlık sonlandırılamadı. Lütfen tekrar deneyin.");
    }
  };

  const handleAra = useCallback(async (metin: string) => {
    setAramaMetni(metin);
    if (metin.trim().length < 2) {
      setAramaSonuclari([]);
      return;
    }
    setAramaYukleniyor(true);
    try {
      const sonuclar = await kullaniciAra(metin.trim());
      setAramaSonuclari(sonuclar);
    } catch (err) {
      console.error("Kullanici arama hatasi:", err);
      setAramaSonuclari([]);
    } finally {
      setAramaYukleniyor(false);
    }
  }, []);

  const handleIstekGonder = async (
    kullaniciId: string,
    kullaniciAd: string,
    kopekId: string,
    kopekAd: string
  ) => {
    try {
      await arkadasVM.istekGonder(kullaniciId, kullaniciAd, kopekId, kopekAd);
      setIstekGonderildi((prev) => new Set([...prev, kopekId]));
    } catch (err: any) {
      alert(err?.message || "İstek gönderilemedi.");
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors -ml-2"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Arkadaşlarım</h1>
            <p className="text-sm text-gray-500">
              {arkadasVM.arkadaslar.length} arkadaş •{" "}
              {arkadasVM.onlineArkadasSayisi} çevrimiçi
            </p>
          </div>
          <div className="flex items-center gap-2">
            {konusmaVM.toplamOkunmayanSayisi > 0 && (
              <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {konusmaVM.toplamOkunmayanSayisi}
              </div>
            )}
            <button
              onClick={() => setArkadasEklePaneli(true)}
              className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              title="Arkadaş ekle"
            >
              <UserPlus size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setAktifTab("arkadaslar")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors text-sm ${
              aktifTab === "arkadaslar"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users size={16} />
              Arkadaşlar
              {arkadasVM.arkadaslar.length > 0 && (
                <span className="text-xs opacity-75">
                  ({arkadasVM.arkadaslar.length})
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setAktifTab("istekler")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors text-sm relative ${
              aktifTab === "istekler"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserPlus size={16} />
              İstekler
              {arkadasVM.gelenIstekler.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {arkadasVM.gelenIstekler.length}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {aktifTab === "arkadaslar" ? (
          <ArkadaslarTab
            arkadaslar={arkadasVM.arkadaslar}
            onlineDurumlar={arkadasVM.onlineDurumlar}
            kullaniciId={arkadasVM.kullaniciId}
            konusmalar={konusmaVM.konusmalar}
            onMesajGonder={handleMesajGonder}
            onArkadasSil={handleArkadasSil}
          />
        ) : (
          <IsteklerTab
            istekler={arkadasVM.gelenIstekler}
            onKabulEt={arkadasVM.istekKabulEt}
            onReddet={arkadasVM.istekReddet}
          />
        )}
      </div>

      {/* Mesaj Panel Modal */}
      {secilenKonusma && (
        <div className="fixed inset-0 z-50 bg-white">
          <MesajPanel
            konusmaId={secilenKonusma.konusmaId}
            karsiTarafAd={secilenKonusma.karsiTarafAd}
            onKapat={() => setSecilenKonusma(null)}
          />
        </div>
      )}

      {/* Arkadaş Ekle Modal */}
      {arkadasEklePaneli && (
        <div className="fixed inset-0 z-50 bg-black/50 flex flex-col justify-end sm:justify-center sm:items-center">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden max-h-[80dvh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Arkadaş Ekle</h2>
              <button
                onClick={() => {
                  setArkadasEklePaneli(false);
                  setAramaMetni("");
                  setAramaSonuclari([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Arama */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={aramaMetni}
                  onChange={(e) => handleAra(e.target.value)}
                  placeholder="Kullanıcı adı ile ara..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                {aramaYukleniyor && (
                  <Loader2
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin"
                  />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                En az 2 karakter girin
              </p>
            </div>

            {/* Sonuçlar */}
            <div className="flex-1 overflow-y-auto">
              {aramaSonuclari.length === 0 && aramaMetni.trim().length >= 2 && !aramaYukleniyor && (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <Search size={32} className="mb-2 opacity-40" />
                  <p className="text-sm">Kullanıcı bulunamadı</p>
                </div>
              )}
              {aramaSonuclari.map((kullanici) => (
                <div
                  key={kullanici.kullaniciId}
                  className="px-4 py-3 border-b border-gray-50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">👤</span>
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">
                      {kullanici.kullaniciAd}
                    </span>
                  </div>
                  {kullanici.kopekler.map((kopek) => (
                    <div
                      key={kopek.kopekId}
                      className="flex items-center justify-between ml-10 mb-1.5"
                    >
                      <div>
                        <span className="text-sm text-gray-700">
                          🐕 {kopek.kopekAd}
                        </span>
                        {kopek.irk && (
                          <span className="text-xs text-gray-400 ml-1.5">
                            {kopek.irk}
                          </span>
                        )}
                      </div>
                      <button
                        disabled={istekGonderildi.has(kopek.kopekId)}
                        onClick={() =>
                          handleIstekGonder(
                            kullanici.kullaniciId,
                            kullanici.kullaniciAd,
                            kopek.kopekId,
                            kopek.kopekAd
                          )
                        }
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          istekGonderildi.has(kopek.kopekId)
                            ? "bg-gray-100 text-gray-400 cursor-default"
                            : "bg-blue-500 hover:bg-blue-600 text-white"
                        }`}
                      >
                        {istekGonderildi.has(kopek.kopekId) ? "Gönderildi" : "İstek Gönder"}
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Arkadaşlar Tab — compact messaging-style list
// =============================================================================

interface ArkadaslarTabProps {
  arkadaslar: any[];
  onlineDurumlar: Map<string, boolean>;
  kullaniciId: string;
  konusmalar: any[];
  onMesajGonder: (karsiTarafId: string, karsiTarafAd: string) => void;
  onArkadasSil: (arkadas: any) => void;
}

function ArkadaslarTab({
  arkadaslar,
  onlineDurumlar,
  kullaniciId,
  konusmalar,
  onMesajGonder,
  onArkadasSil,
}: ArkadaslarTabProps) {
  if (arkadaslar.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Users size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Henüz arkadaşınız yok
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-xs">
          Sağ üstteki + butonuna basarak kullanıcı adı ile arkadaş ekleyebilirsiniz!
        </p>
      </div>
    );
  }

  const benimUid = auth.currentUser?.uid || kullaniciId;

  // Tekrarlayan arkadaşlık kayıtlarını birleştir
  const benzersizArkadaslar = arkadaslar.reduce((acc: any[], arkadas) => {
    const karsiTarafId =
      arkadas.gonderenId === benimUid ? arkadas.aliciId : arkadas.gonderenId;
    const zatenVar = acc.some((a) => {
      const aKarsiTarafId =
        a.gonderenId === benimUid ? a.aliciId : a.gonderenId;
      return aKarsiTarafId === karsiTarafId;
    });
    if (!zatenVar) acc.push(arkadas);
    return acc;
  }, []);

  // Son mesaj tarihine göre sırala (konuşması olanlar önce)
  const siraliArkadaslar = [...benzersizArkadaslar].sort((a, b) => {
    const benimUidRef = benimUid;
    const aKarsiTarafId =
      a.gonderenId === benimUidRef ? a.aliciId : a.gonderenId;
    const bKarsiTarafId =
      b.gonderenId === benimUidRef ? b.aliciId : b.gonderenId;

    const aKonusma = konusmalar.find(
      (k) => k.katilimcilar.includes(aKarsiTarafId) && k.katilimcilar.includes(benimUidRef)
    );
    const bKonusma = konusmalar.find(
      (k) => k.katilimcilar.includes(bKarsiTarafId) && k.katilimcilar.includes(benimUidRef)
    );

    const aTarih = aKonusma?.sonMesajTarihi || 0;
    const bTarih = bKonusma?.sonMesajTarihi || 0;
    return bTarih - aTarih;
  });

  return (
    <div className="divide-y divide-gray-100 bg-white">
      {siraliArkadaslar.map((arkadas) => {
        const benGonderdim = arkadas.gonderenId === benimUid;
        const karsiTarafId = benGonderdim ? arkadas.aliciId : arkadas.gonderenId;
        const karsiTarafAd = benGonderdim
          ? arkadas.aliciAd || arkadas.gonderenAd
          : arkadas.gonderenAd || arkadas.aliciAd;
        const kopekAd = arkadas.kopekAd;

        const isOnline = onlineDurumlar.get(karsiTarafId) || false;

        const konusma = konusmalar.find(
          (k) =>
            k.katilimcilar.includes(karsiTarafId) &&
            k.katilimcilar.includes(benimUid)
        );
        const okunmayanSayisi = konusma?.okunmayanSayisi?.[benimUid] || 0;

        // Son mesaj önizlemesi: "Sen: ..." veya "Ad: ..."
        let sonMesajOnizleme = kopekAd;
        if (konusma?.sonMesaj) {
          const gonderenBenim = konusma.sonMesajGonderenId === benimUid;
          const gonderenAdi = gonderenBenim ? "Sen" : karsiTarafAd.split(" ")[0];
          sonMesajOnizleme = `${gonderenAdi}: ${konusma.sonMesaj}`;
        }

        return (
          <div
            key={arkadas.id}
            className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => onMesajGonder(karsiTarafId, karsiTarafAd)}
          >
            {/* Avatar with online indicator */}
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-lg">🐕</span>
              </div>
              {isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3
                  className={`text-sm truncate ${
                    okunmayanSayisi > 0
                      ? "font-bold text-gray-900"
                      : "font-semibold text-gray-700"
                  }`}
                >
                  {karsiTarafAd}
                  {isOnline && (
                    <Circle
                      size={6}
                      className="inline ml-1.5 fill-green-500 text-green-500"
                    />
                  )}
                </h3>
                {konusma?.sonMesajTarihi ? (
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {zamanKisa(konusma.sonMesajTarihi)}
                  </span>
                ) : null}
              </div>
              <p
                className={`text-xs truncate ${
                  okunmayanSayisi > 0
                    ? "font-medium text-gray-700"
                    : "text-gray-400"
                }`}
              >
                {sonMesajOnizleme}
              </p>
            </div>

            {/* Right: unread badge + delete */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {okunmayanSayisi > 0 && (
                <div className="bg-blue-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                  {okunmayanSayisi}
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArkadasSil(arkadas);
                }}
                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Arkadaşlığı sonlandır"
              >
                <UserMinus size={15} />
              </button>
            </div>
          </div>
        );
      })}

      {/* Mesaj gönder butonu sadece hiç konuşma yoksa görünür, normalde kart tıklanınca açılır */}
      <div className="flex items-center gap-2 px-4 py-3 text-xs text-gray-400">
        <MessageCircle size={13} />
        <span>Mesajlaşmak için bir arkadaşa dokun</span>
      </div>
    </div>
  );
}

// =============================================================================
// İstekler Tab
// =============================================================================

interface IsteklerTabProps {
  istekler: any[];
  onKabulEt: (arkadasId: string) => Promise<void>;
  onReddet: (arkadasId: string) => Promise<void>;
}

function IsteklerTab({ istekler, onKabulEt, onReddet }: IsteklerTabProps) {
  if (istekler.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <UserPlus size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Bekleyen istek yok
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-xs">
          Yeni arkadaşlık istekleri burada görünecek
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {istekler.map((istek) => (
        <div
          key={istek.id}
          className="px-4 py-4 bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🐕</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm">
                {istek.gonderenAd}
              </h3>
              <p className="text-xs text-gray-500">
                {istek.kopekAd} için arkadaşlık isteği
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(istek.olusturmaTarihi).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onKabulEt(istek.id)}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg transition-colors text-sm"
            >
              <Check size={15} />
              Kabul Et
            </button>
            <button
              onClick={() => onReddet(istek.id)}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors text-sm"
            >
              <XCircle size={15} />
              Reddet
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
