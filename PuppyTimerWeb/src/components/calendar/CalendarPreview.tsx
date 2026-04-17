// =============================================================================
// PawLand - CalendarPreview (Basima Hazir Takvim Onizleme)
// =============================================================================

import React from "react";
import { Printer, X } from "lucide-react";
import type { TakvimFoto } from "../../types/models";

interface CalendarPreviewProps {
  yil: number;
  fotolar: Map<number, TakvimFoto>;
  onClose: () => void;
}

const AY_ADLARI = [
  "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran",
  "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik",
];

const GUN_ADLARI = ["Pt", "Sa", "Ca", "Pe", "Cu", "Ct", "Pz"];

function ayGunleri(yil: number, ay: number): (number | null)[] {
  const ilkGun = new Date(yil, ay, 1).getDay();
  const gunSayisi = new Date(yil, ay + 1, 0).getDate();
  // Pazartesi = 0 olacak sekilde ayarla
  const baslangicOffset = ilkGun === 0 ? 6 : ilkGun - 1;

  const gunler: (number | null)[] = [];
  for (let i = 0; i < baslangicOffset; i++) {
    gunler.push(null);
  }
  for (let d = 1; d <= gunSayisi; d++) {
    gunler.push(d);
  }
  return gunler;
}

const CalendarPreview: React.FC<CalendarPreviewProps> = ({
  yil,
  fotolar,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-white overflow-y-auto">
      {/* No-print header */}
      <div className="print:hidden sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        <h2 className="text-lg font-bold text-gray-900">{yil} Takvimi</h2>
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-xl transition-colors text-sm"
        >
          <Printer size={16} />
          Yazdir
        </button>
      </div>

      {/* Takvim icerigi */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Baslik */}
        <div className="text-center mb-8 print:mb-4">
          <h1 className="text-4xl font-bold text-gray-900 print:text-3xl">
            {yil}
          </h1>
          <p className="text-gray-400 text-sm mt-1">PawLand Takvim</p>
        </div>

        {/* 12 ay grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 print:gap-4">
          {Array.from({ length: 12 }, (_, ay) => {
            const foto = fotolar.get(ay);
            const gunler = ayGunleri(yil, ay);

            return (
              <div
                key={ay}
                className="break-inside-avoid border border-gray-200 rounded-xl overflow-hidden print:rounded-none print:border-gray-300"
              >
                {/* Foto */}
                {foto && (
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                    <img
                      src={`data:image/jpeg;base64,${foto.fotoData}`}
                      alt={AY_ADLARI[ay]}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Ay adi + aciklama */}
                <div className="px-3 py-2 bg-orange-50 print:bg-orange-50">
                  <h3 className="text-lg font-bold text-orange-700">
                    {AY_ADLARI[ay]}
                  </h3>
                  {foto?.aciklama && (
                    <p className="text-xs text-gray-500 italic">
                      {foto.aciklama}
                    </p>
                  )}
                </div>

                {/* Mini takvim gridi */}
                <div className="px-3 py-2">
                  <div className="grid grid-cols-7 gap-0.5 text-center">
                    {GUN_ADLARI.map((gun) => (
                      <span
                        key={gun}
                        className="text-[9px] font-medium text-gray-400"
                      >
                        {gun}
                      </span>
                    ))}
                    {gunler.map((gun, idx) => (
                      <span
                        key={idx}
                        className={`text-[10px] py-0.5 ${
                          gun ? "text-gray-700" : ""
                        }`}
                      >
                        {gun ?? ""}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 print:mt-4 text-gray-300 text-xs">
          PawLand ile olusturuldu
        </div>
      </div>
    </div>
  );
};

export default CalendarPreview;
