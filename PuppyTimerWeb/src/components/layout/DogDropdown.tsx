// =============================================================================
// PawLand - Dog Dropdown Selector
// Compact dropdown menu for quick dog switching
// =============================================================================

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus } from "lucide-react";
import DogAvatar from "../common/DogAvatar";
import { saveLastSelectedDog } from "../../services/dogSelectionService";

interface DogDropdownDog {
  id?: number;
  ad: string;
  irk: string;
  cinsiyet: string;
  fotoData?: string | null;
  avatarData?: string | null;
  renkler?: { primary: string; secondary: string; belly: string };
}

interface DogDropdownProps {
  dogs: DogDropdownDog[];
  selectedId: number;
  onSelect: (id: number) => void;
  onAdd: () => void;
}

const DogDropdown: React.FC<DogDropdownProps> = ({
  dogs,
  selectedId,
  onSelect,
  onAdd,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDog = dogs.find((d) => d.id === selectedId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (id: number) => {
    saveLastSelectedDog(id);
    onSelect(id);
    setIsOpen(false);
  };

  const handleAdd = () => {
    onAdd();
    setIsOpen(false);
  };

  // Get primary color for the selected dog (or default orange)
  const getPrimaryColor = (dog?: DogDropdownDog) => {
    if (dog?.renkler?.primary) {
      return dog.renkler.primary;
    }
    return "#e07a2f"; // default warm orange
  };

  const primaryColor = getPrimaryColor(selectedDog);

  return (
    <div ref={dropdownRef} className="relative flex-1">
      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl smooth-transition card-hover-lift"
        style={{
          background: 'var(--color-bg-card)',
          border: `1px solid ${isOpen ? primaryColor : 'var(--color-border)'}`,
          boxShadow: isOpen ? `0 0 0 2px ${primaryColor}20` : 'none',
        }}
      >
        {selectedDog ? (
          <>
            <DogAvatar
              fotoData={selectedDog.fotoData}
              avatarData={selectedDog.avatarData}
              cinsiyet={selectedDog.cinsiyet}
              irk={selectedDog.irk}
              size={32}
            />
            <div className="flex-1 text-left min-w-0">
              <div className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>
                {selectedDog.ad}
              </div>
              <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                {selectedDog.irk}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 text-left text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Köpek seç...
          </div>
        )}
        <ChevronDown
          size={18}
          className={`smooth-transition ${
            isOpen ? "rotate-180" : ""
          }`}
          style={{ color: 'var(--color-text-muted)' }}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-lg z-[1200] max-h-[320px] overflow-y-auto soft-shadow-lg" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          {/* Dog list */}
          <div className="py-1">
            {dogs.map((dog) => {
              const isSelected = dog.id === selectedId;
              const dogColor = getPrimaryColor(dog);

              return (
                <button
                  key={dog.id}
                  type="button"
                  onClick={() => dog.id !== undefined && handleSelect(dog.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 smooth-transition card-hover-lift`}
                  style={{
                    backgroundColor: isSelected ? `${dogColor}15` : undefined,
                  }}
                >
                  <div
                    className={`rounded-full p-0.5 smooth-transition ${
                      isSelected ? "ring-2 ring-offset-1" : ""
                    }`}
                    style={{
                      ...(isSelected && {
                        '--tw-ring-color': dogColor,
                      } as React.CSSProperties),
                    }}
                  >
                    <DogAvatar
                      fotoData={dog.fotoData}
                      avatarData={dog.avatarData}
                      cinsiyet={dog.cinsiyet}
                      irk={dog.irk}
                      size={36}
                    />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div
                      className={`font-semibold text-sm truncate ${
                        isSelected ? "text-gray-900" : "text-gray-700"
                      }`}
                    >
                      {dog.ad}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {dog.irk}
                    </div>
                  </div>
                  {isSelected && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: dogColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Add dog button */}
          <div className="border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button
              type="button"
              onClick={handleAdd}
              className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors"
              style={{ color: 'var(--color-primary)' }}
            >
              <div className="w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: 'var(--color-accent-warm)' }}>
                <Plus size={18} />
              </div>
              <span className="font-semibold text-sm">Yeni Köpek Ekle</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DogDropdown;
