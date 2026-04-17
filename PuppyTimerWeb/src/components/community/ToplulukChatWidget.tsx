// =============================================================================
// PawLand - ToplulukChatWidget
// Collapsible community chat widget for MapPage
// =============================================================================

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, AlertCircle, Flag, Ban, UserPlus } from "lucide-react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { useToplulukChatViewModel } from "../../hooks/useToplulukChatViewModel";
import { kullaniciEngelle } from "../../services/toplulukChatService";
import { sikayetGonder } from "../../services/sikayetService";
import { arkadasIstegiGonder } from "../../services/arkadasService";
import { auth, firestore } from "../../services/firebase";
import { MesajRengi, mesajRengiHex } from "../../types/enums";

export default function ToplulukChatWidget() {
  const [acik, setAcik] = useState(false);
  const [mesajInput, setMesajInput] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [secilenKullanici, setSecilenKullanici] = useState<{
    id: string;
    ad: string;
  } | null>(null);
  const [sikayetModalAcik, setSikayetModalAcik] = useState(false);
  const mesajListesiRef = useRef<HTMLDivElement>(null);

  const {
    mesajlar,
    yukleniyor,
    hata,
    kalanHak,
    sonMesajZamani,
    yeniMesajSayisi,
    mesajGonder,
    yeniMesajlariIsaretle,
  } = useToplulukChatViewModel();

  // Scroll to bottom when new messages arrive or widget opens
  useEffect(() => {
    if (acik && mesajListesiRef.current) {
      mesajListesiRef.current.scrollTop = mesajListesiRef.current.scrollHeight;
    }
  }, [mesajlar, acik]);

  // Mark messages as seen when opening widget
  useEffect(() => {
    if (acik) {
      yeniMesajlariIsaretle();
    }
  }, [acik, yeniMesajlariIsaretle]);

  const handleToggle = () => {
    setAcik(!acik);
  };

  const handleMesajGonder = async () => {
    if (!mesajInput.trim() || gonderiliyor) return;

    setGonderiliyor(true);
    try {
      await mesajGonder(mesajInput);
      setMesajInput("");
    } catch (error) {
      // Error already handled in ViewModel
    } finally {
      setGonderiliyor(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleMesajGonder();
    }
  };

  const handleKullaniciTiklama = (kullaniciId: string, kullaniciAd: string) => {
    // Don't show modal for own messages
    if (auth.currentUser && kullaniciId === auth.currentUser.uid) return;

    setSecilenKullanici({ id: kullaniciId, ad: kullaniciAd });
  };

  const handleSikayetEt = async (kategori: "hakaret" | "spam" | "rahatsizlik") => {
    if (!secilenKullanici) return;

    const kategoriMesajlari = {
      hakaret: "Topluluk chat'inde hakaret",
      spam: "Topluluk chat'inde spam",
      rahatsizlik: "Topluluk chat'inde rahatsız edici davranış",
    };

    try {
      // We don't have kopekId in community chat, so we'll use user ID as a placeholder
      await sikayetGonder(
        secilenKullanici.id,
        secilenKullanici.id, // Using userId as kopekId placeholder
        kategori,
        kategoriMesajlari[kategori]
      );
      alert("Şikayet gönderildi. Teşekkürler!");
      setSecilenKullanici(null);
      setSikayetModalAcik(false);
    } catch (error) {
      alert("Şikayet gönderilemedi. Lütfen tekrar deneyin.");
    }
  };

  const handleSikayetModalAc = () => {
    setSikayetModalAcik(true);
  };

  const handleEngelle = () => {
    if (!secilenKullanici) return;

    if (
      window.confirm(
        `${secilenKullanici.ad} kullanıcısını engellemek istediğinize emin misiniz? Mesajlarını artık göremeyeceksiniz.`
      )
    ) {
      kullaniciEngelle(secilenKullanici.id);
      alert("Kullanıcı engellendi.");
      setSecilenKullanici(null);
      // Reload messages to filter out blocked user
      window.location.reload();
    }
  };

  const handleArkadasEkle = async () => {
    if (!secilenKullanici) return;

    try {
      // Find user's dog in toplulukKopekleri
      const q = query(
        collection(firestore, "toplulukKopekleri"),
        where("olusturanId", "==", secilenKullanici.id),
        where("aktif", "==", true),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        alert("Bu kullanıcının toplulukta paylaştığı köpek bulunamadı.");
        return;
      }

      const kopekData = snapshot.docs[0].data();
      const kopekId = snapshot.docs[0].id;

      await arkadasIstegiGonder(
        secilenKullanici.id,
        secilenKullanici.ad,
        kopekId,
        kopekData.kopekAd || "Köpek"
      );

      alert("Arkadaşlık isteği gönderildi!");
      setSecilenKullanici(null);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Arkadaş isteği gönderilemedi. Lütfen tekrar deneyin.");
      }
    }
  };

  // Calculate remaining time for rate limit
  const kalanSureDk = sonMesajZamani
    ? Math.max(
        0,
        Math.ceil((5 * 60 * 1000 - (Date.now() - sonMesajZamani)) / 1000 / 60)
      )
    : null;

  // Minimized state
  if (!acik) {
    return (
      <button
        onClick={handleToggle}
        className="fixed bottom-20 right-4 z-[1000] flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-full shadow-lg transition-all"
      >
        <MessageCircle size={20} />
        <span className="text-sm">Sohbet</span>
        {yeniMesajSayisi > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {yeniMesajSayisi > 99 ? "99+" : yeniMesajSayisi}
          </span>
        )}
      </button>
    );
  }

  // Expanded state
  return (
    <>
      <div className="fixed bottom-20 right-4 z-[1000] w-80 h-[400px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} />
            <h3 className="font-bold text-sm">Topluluk Chat</h3>
          </div>
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={mesajListesiRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50"
        >
          {yukleniyor ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={24} className="animate-spin text-orange-500" />
            </div>
          ) : mesajlar.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle size={32} className="mb-2 opacity-50" />
              <p className="text-xs text-center">
                Henüz mesaj yok
                <br />
                İlk mesajı sen gönder!
              </p>
            </div>
          ) : (
            mesajlar
              .slice()
              .reverse()
              .map((mesaj) => {
                const mesajRenk = mesaj.mesajRengi || MesajRengi.Varsayilan;
                const renkHex = mesajRengiHex(mesajRenk);
                const isPremiumRenk = mesajRenk !== MesajRengi.Varsayilan;

                return (
                  <div key={mesaj.id} className="flex flex-col">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKullaniciTiklama(mesaj.gonderenId, mesaj.gonderenAd);
                      }}
                      className="text-xs mb-0.5 hover:underline transition-colors text-left cursor-pointer font-medium"
                      style={{
                        color: renkHex,
                      }}
                    >
                      @{mesaj.gonderenAd}
                    </button>
                    <div
                      className={`rounded-lg px-3 py-2 shadow-sm ${
                        isPremiumRenk ? "bg-white/90" : "bg-white"
                      }`}
                      style={{
                        border: `2px solid ${renkHex}`,
                      }}
                    >
                      <p
                        className="text-sm break-words font-medium"
                        style={{
                          color: renkHex,
                        }}
                      >
                        {mesaj.icerik}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(mesaj.olusturmaTarihi).toLocaleTimeString(
                          "tr-TR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3 space-y-2 bg-white rounded-b-2xl">
          {/* Error message */}
          {hata && (
            <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{hata}</p>
            </div>
          )}

          {/* Input area */}
          <div className="flex items-end gap-2">
            <textarea
              value={mesajInput}
              onChange={(e) => setMesajInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Mesaj yaz..."
              maxLength={150}
              rows={2}
              disabled={gonderiliyor || kalanHak === 0}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleMesajGonder}
              disabled={
                !mesajInput.trim() || gonderiliyor || kalanHak === 0
              }
              className="flex-shrink-0 p-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              {gonderiliyor ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>

          {/* Rate limit info */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              {mesajInput.length}/150 karakter
            </span>
            <span
              className={`font-medium ${
                kalanHak === 0 ? "text-red-600" : "text-gray-600"
              }`}
            >
              {kalanHak}/5 mesaj
              {kalanHak === 0 && kalanSureDk && ` • ${kalanSureDk}dk kaldı`}
            </span>
          </div>
        </div>
      </div>

      {/* User action modal */}
      {secilenKullanici && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSecilenKullanici(null)}
          />

          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                @{secilenKullanici.ad}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Bu kullanıcı için işlem seçin
              </p>
            </div>

            <div className="p-5 space-y-3">
              <button
                onClick={handleArkadasEkle}
                className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition-colors"
              >
                <UserPlus size={18} />
                <span className="font-medium text-sm">Arkadaş Ekle</span>
              </button>

              <button
                onClick={handleSikayetModalAc}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-colors"
              >
                <Flag size={18} />
                <span className="font-medium text-sm">Şikayet Et</span>
              </button>

              <button
                onClick={handleEngelle}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
              >
                <Ban size={18} />
                <span className="font-medium text-sm">Engelle</span>
              </button>

              <button
                onClick={() => setSecilenKullanici(null)}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-900 text-sm transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint category modal */}
      {sikayetModalAcik && secilenKullanici && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSikayetModalAcik(false)}
          />

          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Şikayet Sebebi</h3>
              <p className="text-xs text-gray-500 mt-1">
                @{secilenKullanici.ad} için şikayet sebebini seçin
              </p>
            </div>

            <div className="p-5 space-y-3">
              <button
                onClick={() => handleSikayetEt("hakaret")}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-colors"
              >
                <Flag size={18} />
                <div className="text-left">
                  <div className="font-medium text-sm">Hakaret</div>
                  <div className="text-xs text-red-600">Küfür, hakaret içeren mesajlar</div>
                </div>
              </button>

              <button
                onClick={() => handleSikayetEt("spam")}
                className="w-full flex items-center gap-3 px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl transition-colors"
              >
                <Flag size={18} />
                <div className="text-left">
                  <div className="font-medium text-sm">Spam</div>
                  <div className="text-xs text-orange-600">Tekrarlayan, spam mesajlar</div>
                </div>
              </button>

              <button
                onClick={() => handleSikayetEt("rahatsizlik")}
                className="w-full flex items-center gap-3 px-4 py-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-xl transition-colors"
              >
                <Flag size={18} />
                <div className="text-left">
                  <div className="font-medium text-sm">Rahatsızlık</div>
                  <div className="text-xs text-yellow-600">Rahatsız edici davranış</div>
                </div>
              </button>

              <button
                onClick={() => setSikayetModalAcik(false)}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-900 text-sm transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
