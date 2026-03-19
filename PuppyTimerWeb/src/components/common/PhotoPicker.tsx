import React, { useRef } from "react";
import { Camera, X, Image } from "lucide-react";

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
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const img = new window.Image();
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = dataUrl; });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const maxSize = 800;
      let w = img.width, h = img.height;
      if (w > h && w > maxSize) { h = (h * maxSize) / w; w = maxSize; }
      else if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; }
      canvas.width = w; canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL("image/jpeg", 0.7);
      onChange(compressed.split(",")[1]);
    } catch {
      alert("Fotoğraf yüklenemedi. Lütfen tekrar deneyin.");
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex items-center gap-3">
      {/* Thumbnail */}
      <div className="relative flex-shrink-0">
        {fotoData ? (
          <>
            <img src={`data:image/jpeg;base64,${fotoData}`} alt="Fotoğraf"
              className="w-14 h-14 object-cover rounded-xl border" style={{ borderColor: 'var(--color-border-light)' }} />
            <button type="button" onClick={() => onChange(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow">
              <X size={11} />
            </button>
          </>
        ) : (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-border-light)', border: '1px dashed var(--color-border)' }}>
            <Image size={20} style={{ color: 'var(--color-text-muted)' }} />
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-1.5 flex-1">
        <button type="button" onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium smooth-transition"
          style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border-light)', color: 'var(--color-text)' }}>
          <Camera size={14} />
          {fotoData ? "Fotoğrafı Değiştir" : "Fotoğraf Ekle"}
        </button>
        {fotoData && (
          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Silmek için üstteki × ikonuna dokun</p>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  );
};

export default PhotoPicker;
