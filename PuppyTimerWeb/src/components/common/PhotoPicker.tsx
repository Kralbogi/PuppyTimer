import React, { useRef } from "react";
import { Camera, X } from "lucide-react";

interface PhotoPickerProps {
  fotoData: string | null;
  onChange: (data: string | null) => void;
}

const PhotoPicker: React.FC<PhotoPickerProps> = ({ fotoData, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Resmi yükle
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Image objesine çevir
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = dataUrl;
      });

      // Canvas ile yeniden boyutlandır ve sıkıştır
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Maksimum boyut 800px (daha iyi depolama tasarrufu)
      const maxSize = 800;
      let width = img.width;
      let height = img.height;

      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // JPEG olarak sıkıştır (kalite 0.7 - daha agresif sıkıştırma)
      const compressed = canvas.toDataURL("image/jpeg", 0.7);
      const base64 = compressed.split(",")[1];
      onChange(base64);
    } catch (error) {
      console.error("Fotoğraf işlenirken hata:", error);
      alert("Fotoğraf yüklenemedi. Lütfen tekrar deneyin.");
    }

    // Reset so same file can be picked again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {fotoData ? (
        <div className="relative">
          <img
            src={`data:image/jpeg;base64,${fotoData}`}
            alt="Fotoğraf"
            className="w-48 h-48 object-cover rounded-xl"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400">
          <Camera size={36} />
          <span className="text-sm mt-2">Fotoğraf Seç</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleButtonClick}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Camera size={16} />
        {fotoData ? "Değiştir" : "Fotoğraf Çek"}
      </button>
    </div>
  );
};

export default PhotoPicker;
