import React, { useState, useEffect } from "react";
import { fetchBreedImageUrl } from "../../services/breedImageService";

interface DogAvatarProps {
  fotoData?: string | null;
  avatarData?: string | null;
  cinsiyet: string;
  size?: number;
  irk?: string;
}

const DogAvatar: React.FC<DogAvatarProps> = ({
  fotoData,
  avatarData,
  cinsiyet,
  size = 48,
  irk,
}) => {
  const [breedImgUrl, setBreedImgUrl] = useState<string | null>(null);

  const imageData = avatarData || fotoData;

  // Fetch breed image if no photo
  useEffect(() => {
    if (imageData || !irk) return;
    let cancelled = false;
    fetchBreedImageUrl(irk).then((url) => {
      if (!cancelled) setBreedImgUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [imageData, irk]);

  // Base64 photo
  if (imageData) {
    return (
      <img
        src={`data:image/jpeg;base64,${imageData}`}
        alt="Kopek"
        className="rounded-full object-cover"
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      />
    );
  }

  // Breed image from API
  if (breedImgUrl) {
    return (
      <img
        src={breedImgUrl}
        alt={irk || "Kopek"}
        className="rounded-full object-cover"
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
        onError={() => setBreedImgUrl(null)}
      />
    );
  }

  // Fallback emoji
  const bgColor = cinsiyet === "Erkek" ? "bg-blue-400" : "bg-pink-400";

  return (
    <div
      className={`${bgColor} rounded-full flex items-center justify-center`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      <span style={{ fontSize: size * 0.45 }} role="img" aria-label="kopek">
        🐕
      </span>
    </div>
  );
};

export default DogAvatar;
