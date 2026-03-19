// =============================================================================
// PawLand - QR Code Modal
// Generates and displays QR code for dog profile sharing
// =============================================================================

import React, { useEffect, useRef, useState } from "react";
import { X, Download, Share2 } from "lucide-react";
import QRCode from "qrcode";
import type { Kopek } from "../../types/models";

interface QRCodeModalProps {
  kopek: Kopek;
  onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ kopek, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !kopek.id) return;

    // Generate QR code data
    // Format: pawland://dog/{dogId}
    // This can be expanded to include Firestore dog ID if shared in community
    const qrData = `pawland://dog/${kopek.id}`;

    QRCode.toCanvas(
      canvasRef.current,
      qrData,
      {
        width: 280,
        margin: 2,
        color: {
          dark: "#111111",
          light: "#FFFFFF",
        },
      },
      (error) => {
        if (error) {
          console.error("QR code generation failed:", error);
        } else {
          setQrGenerated(true);
        }
      }
    );
  }, [kopek.id]);

  const handleDownload = () => {
    if (!canvasRef.current) return;

    const link = document.createElement("a");
    link.download = `${kopek.ad}-qr-code.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvasRef.current?.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        });
      });

      const file = new File([blob], `${kopek.ad}-qr-code.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${kopek.ad} - PawLand`,
          text: `${kopek.ad}'ın QR kodunu tara ve profilini gör!`,
          files: [file],
        });
      } else {
        // Fallback to download if Web Share API is not supported
        handleDownload();
      }
    } catch (error) {
      console.error("Share failed:", error);
      // Fallback to download
      handleDownload();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">QR Kod</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
            <canvas ref={canvasRef} />
          </div>

          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">{kopek.ad}</p>
            <p className="text-sm text-gray-500">{kopek.irk}</p>
            <p className="text-xs text-gray-400 mt-2">
              Bu QR kodu tarayarak profilimi görüntüleyebilirsin
            </p>
          </div>

          {/* Action buttons */}
          {qrGenerated && (
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
              >
                <Download size={18} />
                <span>İndir</span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors"
              >
                <Share2 size={18} />
                <span>Paylaş</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
