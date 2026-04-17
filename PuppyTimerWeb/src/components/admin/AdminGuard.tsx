// =============================================================================
// AdminGuard — Yalnızca admin UID için render eder
// Eşleşmezse genel "404" ekranı gösterir (panelin varlığını belli etmez)
// =============================================================================

import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { auth } from "../../services/firebase";

interface AdminGuardProps {
  children: React.ReactNode;
}

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID as string | undefined;

export default function AdminGuard({ children }: AdminGuardProps) {
  const navigate = useNavigate();
  const currentUid = auth.currentUser?.uid;

  if (!ADMIN_UID || currentUid !== ADMIN_UID) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <ShieldOff size={56} className="text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-700 mb-2">404</h1>
        <p className="text-gray-500 mb-6 text-sm">Bu sayfa bulunamadı.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors text-sm"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
