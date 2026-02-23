// =============================================================================
// PuppyTimer Web - BreedSelector (Kopek Cinsi Secici)
// Aranabilir liste ile kopek cinsi secme bileseni
// =============================================================================

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { kopekCinsleriAra } from "../../data/dogBreeds";

interface BreedSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const BreedSelector: React.FC<BreedSelectorProps> = ({
  value,
  onChange,
  placeholder = "Cins seciniz...",
}) => {
  const [open, setOpen] = useState(false);
  const [arama, setArama] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const sonuclar = useMemo(() => kopekCinsleriAra(arama), [arama]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const sec = (cins: string) => {
    onChange(cins);
    setOpen(false);
    setArama("");
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm text-left flex items-center justify-between bg-white"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
      </button>

      {/* Full-screen Modal */}
      {open && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setArama("");
              }}
              className="p-1 text-gray-500"
            >
              <X size={22} />
            </button>
            <h2 className="text-lg font-bold text-gray-900 flex-1">
              Kopek Cinsi Sec
            </h2>
          </div>

          {/* Search */}
          <div className="px-4 py-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                ref={inputRef}
                type="text"
                value={arama}
                onChange={(e) => setArama(e.target.value)}
                placeholder="Cins ara..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm"
              />
              {arama && (
                <button
                  type="button"
                  onClick={() => setArama("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div ref={modalRef} className="flex-1 overflow-y-auto px-4 pb-8">
            {/* Custom input option */}
            {arama.trim() && !sonuclar.includes(arama.trim()) && (
              <button
                type="button"
                onClick={() => sec(arama.trim())}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left hover:bg-orange-50 transition-colors mb-1"
              >
                <span className="text-sm text-orange-600 font-medium">
                  &quot;{arama.trim()}&quot; olarak ekle
                </span>
              </button>
            )}

            {sonuclar.map((cins) => {
              const secili = cins === value;
              return (
                <button
                  key={cins}
                  type="button"
                  onClick={() => sec(cins)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left transition-colors mb-0.5 ${
                    secili
                      ? "bg-orange-50 text-orange-600"
                      : "hover:bg-gray-50 text-gray-800"
                  }`}
                >
                  <span className="text-sm font-medium">{cins}</span>
                  {secili && (
                    <Check size={18} className="text-orange-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}

            {sonuclar.length === 0 && !arama.trim() && (
              <p className="text-center text-gray-400 text-sm py-8">
                Aramak icin yazmaya baslayin
              </p>
            )}

            {sonuclar.length === 0 && arama.trim() && (
              <p className="text-center text-gray-400 text-sm py-4">
                Sonuc bulunamadi
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default BreedSelector;
