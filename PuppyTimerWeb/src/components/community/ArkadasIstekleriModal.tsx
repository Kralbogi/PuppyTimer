// =============================================================================
// PawLand - Arkadas Istekleri Modal
// Gelen arkadas isteklerini goster ve kabul/red et
// =============================================================================

import { X, Check, XCircle, Users as UsersIcon } from "lucide-react";
import type { KopekArkadas } from "../../types/models";

interface ArkadasIstekleriModalProps {
  istekler: KopekArkadas[];
  onKabulEt: (arkadasId: string) => Promise<void>;
  onReddet: (arkadasId: string) => Promise<void>;
  onClose: () => void;
}

export default function ArkadasIstekleriModal({
  istekler,
  onKabulEt,
  onReddet,
  onClose,
}: ArkadasIstekleriModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <UsersIcon size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Arkadaşlık İstekleri
              </h2>
              <p className="text-xs text-gray-500">
                {istekler.length} bekleyen istek
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {istekler.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <UsersIcon size={24} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Bekleyen istek yok</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {istekler.map((istek) => (
                <div
                  key={istek.id}
                  className="px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-lg"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">
                        {istek.gonderenAd}
                      </p>
                      <p className="text-sm text-gray-500">
                        {istek.kopekAd} için arkadaşlık isteği gönderdi
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(istek.olusturmaTarihi).toLocaleDateString(
                          "tr-TR",
                          {
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onKabulEt(istek.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg transition-colors text-sm"
                    >
                      <Check size={16} />
                      Kabul Et
                    </button>
                    <button
                      onClick={() => onReddet(istek.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors text-sm"
                    >
                      <XCircle size={16} />
                      Reddet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
