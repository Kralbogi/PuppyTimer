// =============================================================================
// PuppyTimer Web - Veteriner Selector
// Dropdown for selecting existing veterinarians or adding new ones
// =============================================================================

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, X } from "lucide-react";
import { db } from "../../db/database";
import type { Veteriner } from "../../types/models";

interface VeterinerSelectorProps {
  selectedVeterinerId?: number;
  selectedVeterinerAdi?: string;
  onSelect: (veterinerId: number | undefined, veterinerAdi: string | undefined) => void;
}

const VeterinerSelector: React.FC<VeterinerSelectorProps> = ({
  selectedVeterinerId,
  selectedVeterinerAdi,
  onSelect,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [yeniVeteriner, setYeniVeteriner] = useState({
    ad: "",
    klinikAdi: "",
    telefon: "",
    adres: "",
    eposta: "",
    not: "",
  });

  // Veteriner listesini getir
  const veterinerler = useLiveQuery(() =>
    db.veterinerler.orderBy("olusturmaTarihi").reverse().toArray()
  );

  const handleVeterinerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    if (value === "yeni") {
      setShowAddModal(true);
      return;
    }

    if (value === "") {
      onSelect(undefined, undefined);
      return;
    }

    const veterinerId = parseInt(value);
    const veteriner = veterinerler?.find((v) => v.id === veterinerId);

    if (veteriner) {
      onSelect(veteriner.id, veteriner.ad);
    }
  };

  const handleManuelInput = (ad: string) => {
    onSelect(undefined, ad);
  };

  const kaydetVeteriner = async () => {
    if (!yeniVeteriner.ad.trim()) {
      alert("Veteriner adı zorunludur");
      return;
    }

    const veteriner: Veteriner = {
      ad: yeniVeteriner.ad.trim(),
      klinikAdi: yeniVeteriner.klinikAdi.trim() || undefined,
      telefon: yeniVeteriner.telefon.trim() || undefined,
      adres: yeniVeteriner.adres.trim() || undefined,
      eposta: yeniVeteriner.eposta.trim() || undefined,
      not: yeniVeteriner.not.trim() || undefined,
      olusturmaTarihi: Date.now(),
    };

    const id = await db.veterinerler.add(veteriner);

    onSelect(id as number, veteriner.ad);
    setShowAddModal(false);
    setYeniVeteriner({
      ad: "",
      klinikAdi: "",
      telefon: "",
      adres: "",
      eposta: "",
      not: "",
    });
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Veteriner
        </label>

        {veterinerler && veterinerler.length > 0 ? (
          <select
            value={selectedVeterinerId || ""}
            onChange={handleVeterinerChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm bg-white"
          >
            <option value="">Seçiniz veya yeni ekleyin</option>
            {veterinerler.map((vet) => (
              <option key={vet.id} value={vet.id}>
                {vet.ad}
                {vet.klinikAdi && ` - ${vet.klinikAdi}`}
              </option>
            ))}
            <option value="yeni">+ Yeni Veteriner Ekle</option>
          </select>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-blue-600"
          >
            <Plus size={16} />
            Veteriner Ekle
          </button>
        )}

        {/* Manuel isim girişi (opsiyonel) */}
        {!selectedVeterinerId && (
          <div className="mt-2">
            <input
              type="text"
              value={selectedVeterinerAdi || ""}
              onChange={(e) => handleManuelInput(e.target.value)}
              placeholder="Veya manuel giriniz..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
            />
          </div>
        )}
      </div>

      {/* Yeni Veteriner Ekleme Modali */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Yeni Veteriner Ekle</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Veteriner Adı *
                </label>
                <input
                  type="text"
                  value={yeniVeteriner.ad}
                  onChange={(e) =>
                    setYeniVeteriner((prev) => ({ ...prev, ad: e.target.value }))
                  }
                  placeholder="Dr. ..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Klinik Adı
                </label>
                <input
                  type="text"
                  value={yeniVeteriner.klinikAdi}
                  onChange={(e) =>
                    setYeniVeteriner((prev) => ({ ...prev, klinikAdi: e.target.value }))
                  }
                  placeholder="Veteriner Kliniği"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={yeniVeteriner.telefon}
                  onChange={(e) =>
                    setYeniVeteriner((prev) => ({ ...prev, telefon: e.target.value }))
                  }
                  placeholder="0532 123 45 67"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Adres
                </label>
                <textarea
                  value={yeniVeteriner.adres}
                  onChange={(e) =>
                    setYeniVeteriner((prev) => ({ ...prev, adres: e.target.value }))
                  }
                  placeholder="Klinik adresi..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  E-posta
                </label>
                <input
                  type="email"
                  value={yeniVeteriner.eposta}
                  onChange={(e) =>
                    setYeniVeteriner((prev) => ({ ...prev, eposta: e.target.value }))
                  }
                  placeholder="doktor@klinik.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Not
                </label>
                <textarea
                  value={yeniVeteriner.not}
                  onChange={(e) =>
                    setYeniVeteriner((prev) => ({ ...prev, not: e.target.value }))
                  }
                  placeholder="Ek notlar..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={kaydetVeteriner}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors text-sm font-medium"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VeterinerSelector;
