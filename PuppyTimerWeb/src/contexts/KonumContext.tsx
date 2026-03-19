import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface KonumContextType {
  konum: [number, number] | null;
  yukleniyor: boolean;
}

const KonumContext = createContext<KonumContextType>({ konum: null, yukleniyor: true });

export function KonumProvider({ children }: { children: ReactNode }) {
  const [konum, setKonum] = useState<[number, number] | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setYukleniyor(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setKonum([pos.coords.latitude, pos.coords.longitude]);
        setYukleniyor(false);
      },
      () => {
        setYukleniyor(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return (
    <KonumContext.Provider value={{ konum, yukleniyor }}>
      {children}
    </KonumContext.Provider>
  );
}

export function useKonum() {
  return useContext(KonumContext);
}
