// =============================================================================
// PawLand - Sepet Context
// Shopping cart state management with localStorage sync
// =============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { SepetItem } from "../types/models";

interface SepetContextType {
  items: SepetItem[];
  toplamFiyat: number;
  toplamAdet: number;
  ekle: (item: Omit<SepetItem, "adet">) => void;
  cikar: (urunId: string) => void;
  adetGuncelle: (urunId: string, yeniAdet: number) => void;
  temizle: () => void;
}

const SepetContext = createContext<SepetContextType | undefined>(undefined);

const STORAGE_KEY = "pawland_sepet";

export function SepetProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SepetItem[]>(() => {
    // Load from localStorage on init
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as SepetItem[];
      }
    } catch (error) {
      console.error("localStorage sepet yukle hatasi:", error);
    }
    return [];
  });

  // Sync to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("localStorage sepet kaydet hatasi:", error);
    }
  }, [items]);

  // Calculate totals
  const toplamFiyat = items.reduce((sum, item) => sum + item.adet * item.birimFiyat, 0);
  const toplamAdet = items.reduce((sum, item) => sum + item.adet, 0);

  // Add item to cart (or increment if already exists)
  const ekle = useCallback((newItem: Omit<SepetItem, "adet">) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.urunId === newItem.urunId);
      if (existing) {
        // Increment quantity
        return prev.map((item) =>
          item.urunId === newItem.urunId
            ? { ...item, adet: item.adet + 1 }
            : item
        );
      } else {
        // Add new item
        return [...prev, { ...newItem, adet: 1 }];
      }
    });
  }, []);

  // Remove item from cart
  const cikar = useCallback((urunId: string) => {
    setItems((prev) => prev.filter((item) => item.urunId !== urunId));
  }, []);

  // Update item quantity
  const adetGuncelle = useCallback((urunId: string, yeniAdet: number) => {
    if (yeniAdet <= 0) {
      cikar(urunId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.urunId === urunId ? { ...item, adet: yeniAdet } : item
      )
    );
  }, [cikar]);

  // Clear cart
  const temizle = useCallback(() => {
    setItems([]);
  }, []);

  const value: SepetContextType = {
    items,
    toplamFiyat,
    toplamAdet,
    ekle,
    cikar,
    adetGuncelle,
    temizle,
  };

  return <SepetContext.Provider value={value}>{children}</SepetContext.Provider>;
}

export function useSepet() {
  const context = useContext(SepetContext);
  if (!context) {
    throw new Error("useSepet must be used within SepetProvider");
  }
  return context;
}
