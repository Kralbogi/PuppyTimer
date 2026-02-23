import React from "react";
import { Plus, X } from "lucide-react";
import DogAvatar from "../common/DogAvatar";

interface DogSelectorDog {
  id?: number;
  ad: string;
  irk: string;
  cinsiyet: string;
  fotoData?: string | null;
  avatarData?: string | null;
}

interface DogSelectorProps {
  dogs: DogSelectorDog[];
  selectedId: number;
  onSelect: (id: number) => void;
  onAdd: () => void;
  onDelete?: (id: number) => void;
}

const DogSelector: React.FC<DogSelectorProps> = ({
  dogs,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
}) => {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex flex-nowrap gap-3 px-4 py-3">
        {dogs.map((dog) => {
          const isSelected = dog.id === selectedId;
          return (
            <button
              key={dog.id}
              type="button"
              onClick={() => dog.id !== undefined && onSelect(dog.id)}
              className="flex flex-col items-center gap-1 flex-shrink-0 relative"
            >
              <div
                className={`rounded-full p-0.5 transition-colors ${
                  isSelected ? "ring-2 ring-orange-500 ring-offset-2" : ""
                }`}
              >
                <DogAvatar
                  fotoData={dog.fotoData}
                  avatarData={dog.avatarData}
                  cinsiyet={dog.cinsiyet}
                  irk={dog.irk}
                  size={40}
                />
              </div>

              {/* Delete badge */}
              {onDelete && dog.id !== undefined && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (dog.id !== undefined) {
                      onDelete(dog.id);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && dog.id !== undefined) {
                      e.stopPropagation();
                      onDelete(dog.id);
                    }
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors z-10"
                >
                  <X size={12} className="text-white" strokeWidth={3} />
                </div>
              )}

              <span
                className={`text-xs font-medium truncate max-w-[56px] ${
                  isSelected ? "text-orange-500" : "text-gray-600"
                }`}
              >
                {dog.ad}
              </span>
            </button>
          );
        })}

        {/* Add button */}
        <button
          type="button"
          onClick={onAdd}
          className="flex flex-col items-center gap-1 flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-400 transition-colors">
            <Plus size={20} />
          </div>
          <span className="text-xs text-gray-400">Ekle</span>
        </button>
      </div>
    </div>
  );
};

export default DogSelector;
