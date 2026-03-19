// =============================================================================
// PawLand - Arkadaşlarım Sayfası
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
    <div className="flex flex-col h-[100dvh]" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div
        className="border-b px-4 py-3"
        style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg smooth-transition -ml-2"
            style={{ color: 'var(--color-text)' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Arkadaşlarım</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
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
              className="p-2 text-white rounded-lg smooth-transition"
              style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
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
            className="flex-1 py-2 px-4 rounded-lg font-medium smooth-transition text-sm"
            style={
              aktifTab === "arkadaslar"
                ? { background: 'linear-gradient(135deg, #ff8c42, #e07a2f)', color: '#fff' }
                : { background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }
            }
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
            className="flex-1 py-2 px-4 rounded-lg font-medium smooth-transition text-sm relative"
            style={
              aktifTab === "istekler"
                ? { background: 'linear-gradient(135deg, #ff8c42, #e07a2f)', color: '#fff' }
                : { background: 'var(--color-border-light)', color: 'var(--color-text-muted)' }
            }
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
        <div className="fixed inset-0 z-50" style={{ background: 'var(--color-bg)' }}>
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
          <div
            className="w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden max-h-[80dvh] flex flex-col"
            style={{ background: 'var(--color-bg-card)' }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Arkadaş Ekle</h2>
              <button
                onClick={() => {
                  setArkadasEklePaneli(false);
                  setAramaMetni("");
                  setAramaSonuclari([]);
                }}
                className="p-2 rounded-lg smooth-transition"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Arama */}
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <input
                  type="text"
                  value={aramaMetni}
                  onChange={(e) => handleAra(e.target.value)}
                  placeholder="Kullanıcı adı ile ara..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  style={{
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                  }}
                  autoFocus
                />
                {aramaYukleniyor && (
                  <Loader2
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 animate-spin"
                  />
                )}
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                En az 2 karakter girin
              </p>
            </div>

            {/* Sonuçlar */}
            <div className="flex-1 overflow-y-auto">
              {aramaSonuclari.length === 0 && aramaMetni.trim().length >= 2 && !aramaYukleniyor && (
                <div className="flex flex-col items-center justify-center py-10" style={{ color: 'var(--color-text-muted)' }}>
                  <Search size={32} className="mb-2 opacity-40" />
                  <p className="text-sm">Kullanıcı bulunamadı</p>
                </div>
              )}
              {aramaSonuclari.map((kullanici) => (
                <div
                  key={kullanici.kullaniciId}
                  className="px-4 py-3 border-b"
                  style={{ borderColor: 'var(--color-border-light)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}>
                      <span className="text-sm"></span>
                    </div>
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                      {kullanici.kullaniciAd}
                    </span>
                  </div>
                  {kullanici.kopekler.map((kopek) => (
                    <div
                      key={kopek.kopekId}
                      className="flex items-center justify-between ml-10 mb-1.5"
                    >
                      <div>
                        <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                           {kopek.kopekAd}
                        </span>
                        {kopek.irk && (
                          <span className="text-xs ml-1.5" style={{ color: 'var(--color-text-muted)' }}>
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
                        className="px-3 py-1 rounded-lg text-xs font-medium smooth-transition"
                        style={
                          istekGonderildi.has(kopek.kopekId)
                            ? { background: 'var(--color-border-light)', color: 'var(--color-text-muted)', cursor: 'default' }
                            : { background: 'linear-gradient(135deg, #ff8c42, #e07a2f)', color: '#fff' }
                        }
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
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'var(--color-border-light)' }}
        >
          <Users size={32} style={{ color: 'var(--color-text-muted)', opacity: 0.6 }} />
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          Henüz arkadaşınız yok
        </h3>
        <p className="text-sm text-center max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
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
    <div style={{ background: 'var(--color-bg-card)' }}>
      {siraliArkadaslar.map((arkadas, idx) => {
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
            className="flex items-center gap-3 px-4 py-3 smooth-transition cursor-pointer"
            style={{
              borderBottom: idx < siraliArkadaslar.length - 1 ? '1px solid var(--color-border-light)' : 'none',
              background: 'var(--color-bg-card)',
            }}
            onClick={() => onMesajGonder(karsiTarafId, karsiTarafAd)}
          >
            {/* Avatar with online indicator */}
            <div className="relative flex-shrink-0">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
              >
                <span className="text-lg"></span>
              </div>
              {isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3
                  className="text-sm truncate"
                  style={{
                    color: 'var(--color-text)',
                    fontWeight: okunmayanSayisi > 0 ? 700 : 600,
                  }}
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
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    {zamanKisa(konusma.sonMesajTarihi)}
                  </span>
                ) : null}
              </div>
              <p
                className="text-xs truncate"
                style={{
                  color: okunmayanSayisi > 0 ? 'var(--color-text)' : 'var(--color-text-muted)',
                  fontWeight: okunmayanSayisi > 0 ? 500 : 400,
                }}
              >
                {sonMesajOnizleme}
              </p>
            </div>

            {/* Right: unread badge + delete */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {okunmayanSayisi > 0 && (
                <div
                  className="text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
                >
                  {okunmayanSayisi}
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArkadasSil(arkadas);
                }}
                className="p-1.5 hover:bg-red-50 rounded-lg smooth-transition"
                style={{ color: 'var(--color-border)' }}
                title="Arkadaşlığı sonlandır"
              >
                <UserMinus size={15} />
              </button>
            </div>
          </div>
        );
      })}

      {/* Mesaj gönder butonu sadece hiç konuşma yoksa görünür, normalde kart tıklanınca açılır */}
      <div className="flex items-center gap-2 px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
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
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'var(--color-border-light)' }}
        >
          <UserPlus size={32} style={{ color: 'var(--color-text-muted)', opacity: 0.6 }} />
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          Bekleyen istek yok
        </h3>
        <p className="text-sm text-center max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
          Yeni arkadaşlık istekleri burada görünecek
        </p>
      </div>
    );
  }

  return (
    <div style={{ borderTop: '1px solid var(--color-border-light)' }}>
      {istekler.map((istek) => (
        <div
          key={istek.id}
          className="px-4 py-4 smooth-transition"
          style={{
            background: 'var(--color-bg-card)',
            borderBottom: '1px solid var(--color-border-light)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #ff8c42, #e07a2f)' }}
            >
              <span className="text-lg"></span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                {istek.gonderenAd}
              </h3>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {istek.kopekAd} için arkadaşlık isteği
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>
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
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg smooth-transition text-sm"
            >
              <Check size={15} />
              Kabul Et
            </button>
            <button
              onClick={() => onReddet(istek.id)}
              className="flex-1 flex items-center justify-center gap-2 font-medium py-2 rounded-lg smooth-transition text-sm"
              style={{ background: 'var(--color-border-light)', color: 'var(--color-text)' }}
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
