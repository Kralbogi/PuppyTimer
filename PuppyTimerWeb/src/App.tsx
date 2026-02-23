import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, cascadeDeleteKopek } from './db/database'
import BottomTabBar from './components/layout/BottomTabBar'
import DogSelector from './components/layout/DogSelector'
import { OnboardingPage } from './pages/OnboardingPage'
import { DogProfilePage } from './pages/DogProfilePage'
import { TimersPage } from './pages/TimersPage'
import { WalksPage } from './pages/WalksPage'
import { ToiletPage } from './pages/ToiletPage'
import { HealthPage } from './pages/HealthPage'
import { MapPage } from './pages/MapPage'
import { TakvimPage } from './pages/TakvimPage'
import { MenuPage } from './pages/MenuPage'
import { ShopPage } from './pages/ShopPage'
import UrunDetayPage from './pages/UrunDetayPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SettingsPage from './pages/SettingsPage'
import { ArkadaslarimPage } from './pages/ArkadaslarimPage'
import AdminPage from './pages/AdminPage'
import SiparisGecmisiPage from './pages/SiparisGecmisiPage'
import { SepetProvider } from './contexts/SepetContext'
import { useState, useEffect, useRef } from 'react'
import { Settings, Users } from 'lucide-react'
import { authDinle } from './services/authService'
import type { User } from 'firebase/auth'
import { useArkadasViewModel } from './hooks/useArkadasViewModel'
import { kopekleriFirestoreDanYukle, firestoreDegisiklikleriniDinle, kopekFirestoreSil } from './services/kopekSenkronizasyon'
import Balloons from './components/common/Balloons'
import { bugunDogumGunuMu } from './services/dateUtils'

function DogLayout() {
  const { id } = useParams()
  const kopekId = Number(id)
  const navigate = useNavigate()
  const location = useLocation()
  const isMapPage = location.pathname.endsWith('/map')
  const kopekler = useLiveQuery(() => db.kopekler.orderBy('ad').toArray()) ?? []
  const arkadasVM = useArkadasViewModel()

  const handleDeleteDog = async (dogId: number) => {
    const dog = kopekler.find((k) => k.id === dogId)
    if (!dog) return
    const confirmed = window.confirm(`"${dog.ad}" adli kopegi kaldirmak istiyor musunuz? Tum verileri silinecektir.`)
    if (!confirmed) return
    await cascadeDeleteKopek(dogId)
    // Firestore'dan da sil
    await kopekFirestoreSil(dogId)
    const remaining = kopekler.filter((k) => k.id !== dogId)
    if (remaining.length > 0 && remaining[0].id) {
      navigate(`/dog/${remaining[0].id}/map`, { replace: true })
    } else {
      navigate('/onboarding', { replace: true })
    }
  }

  // kopekler yüklendikten sonra geçersiz kopek ID'sini yönlendir
  const kopekMevcut = kopekler.some(k => k.id === kopekId)
  if (!kopekMevcut && kopekler.length > 0) {
    return <Navigate to={`/dog/${kopekler[0].id}/map`} replace />
  }

  return (
    <div className="flex flex-col h-[100dvh]">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1 bg-white border-b border-gray-100">
        <DogSelector
          dogs={kopekler}
          selectedId={kopekId}
          onSelect={(dogId: number) => navigate(`/dog/${dogId}/map`)}
          onAdd={() => navigate('/onboarding')}
          onDelete={handleDeleteDog}
        />
        <div className="flex items-center gap-1">
          {/* Arkadas sayfasi butonu */}
          <button
            onClick={() => navigate('/arkadaslarim')}
            className="p-2 text-gray-400 hover:text-gray-600 relative"
          >
            <Users size={20} />
            {arkadasVM.gelenIstekler.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {arkadasVM.gelenIstekler.length}
              </span>
            )}
          </button>
          {/* Ayarlar butonu */}
          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className={isMapPage ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto pb-20"}>
        <Routes>
          <Route index element={<DogProfilePage kopekId={kopekId} />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="shop/urun/:urunId" element={<UrunDetayPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="timers" element={<TimersPage kopekId={kopekId} />} />
          <Route path="walks" element={<WalksPage kopekId={kopekId} />} />
          <Route path="toilet" element={<ToiletPage kopekId={kopekId} />} />
          <Route path="health" element={<HealthPage kopekId={kopekId} />} />
          <Route path="map" element={<MapPage kopekId={kopekId} />} />
          <Route path="calendar" element={<TakvimPage kopekId={kopekId} />} />
        </Routes>
      </div>
      <BottomTabBar />
    </div>
  )
}

export default function App() {
  const kopekler = useLiveQuery(() => db.kopekler.toArray())
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [dogsLoaded, setDogsLoaded] = useState(false)
  const [showBirthdayBalloons, setShowBirthdayBalloons] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [yuklenenKopekler, setYuklenenKopekler] = useState<any[] | null>(null)
  // Track last seen user UID to prevent white screen on Firebase re-auth
  const prevUserUidRef = useRef<string | null>(null)
  // Track last synced user UID to prevent duplicate Firestore syncs on re-auth
  const syncedUserUidRef = useRef<string | null>(null)

  // Auth durumunu dinle
  useEffect(() => {
    const unsubscribe = authDinle((kullanici) => {
      if (kullanici) {
        // Aynı kullanıcı yeniden doğrulandıysa (token yenileme) ekranı sıfırlama
        if (kullanici.uid !== prevUserUidRef.current) {
          setReady(false)
        }
        prevUserUidRef.current = kullanici.uid
      } else {
        prevUserUidRef.current = null
        syncedUserUidRef.current = null
        setDogsLoaded(false)
        setYuklenenKopekler(null)
        setInitialLoadComplete(false)
      }
      setUser(kullanici)
    })
    return unsubscribe
  }, [])

  // Kullanici giris yaptiysa, Firestore'dan kopekleri yukle
  useEffect(() => {
    if (!user) return
    // Aynı kullanıcı için zaten senkronize edildi, tekrar çalıştırma
    if (syncedUserUidRef.current === user.uid) return
    syncedUserUidRef.current = user.uid

    let unsubscribe: (() => void) | undefined

    const yukleVeDinle = async () => {
      try {
        // Firestore'dan kopekleri yukle
        await kopekleriFirestoreDanYukle()

        // IndexedDB'den direkt okuyarak kopek sayisini kontrol et
        // (useLiveQuery'e güvenmek yerine)
        const mevcutKopekler = await db.kopekler.toArray()
        console.log(`📊 Senkronizasyon sonrası: ${mevcutKopekler.length} köpek bulundu`)

        // Yüklenen köpekleri state'e kaydet (routing kararı için)
        setYuklenenKopekler(mevcutKopekler)

        // Daha uzun gecikme - IndexedDB'nin browser'da tamamen güncellendiginden emin ol
        await new Promise(resolve => setTimeout(resolve, 500))

        // Şimdi dogsLoaded'ı set et (bu ready check'i tetikleyecek)
        setDogsLoaded(true)

        // Herhangi bir kopegin dogum gunu bugunku tarihse balonlari goster
        const dogs = await db.kopekler.toArray()
        const birisiDogumGunuMu = dogs.some(k => bugunDogumGunuMu(k.dogumTarihi))
        if (birisiDogumGunuMu) {
          setShowBirthdayBalloons(true)
        }

        // Firestore degisikliklerini dinle
        unsubscribe = firestoreDegisiklikleriniDinle()

        // İlk yükleme tamamlandı
        setInitialLoadComplete(true)
      } catch (error) {
        console.error('Kopekler yuklenemedi:', error)
        // Hata olsa bile devam et (offline mod)
        setDogsLoaded(true)
        setInitialLoadComplete(true)
      }
    }

    yukleVeDinle()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [user])

  useEffect(() => {
    // Kullanıcı giriş yapmamışsa hemen hazır
    if (user === null && kopekler !== undefined) {
      setReady(true)
      return
    }

    // Kullanıcı giriş yapmışsa, Firestore sync tamamlanana kadar bekle
    if (user && kopekler !== undefined && dogsLoaded && initialLoadComplete) {
      setReady(true)
    }
  }, [kopekler, user, dogsLoaded, initialLoadComplete])

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-[100dvh]">
        <div className="text-center">
          <div className="text-4xl mb-2">🐾</div>
          <div className="text-gray-400 text-sm">Yükleniyor...</div>
        </div>
      </div>
    )
  }

  // Giris yapilmamissa login/register sayfalarini goster
  if (!user) {
    return (
      <SepetProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </SepetProvider>
    )
  }

  // Giris yapilmissa ana uygulama
  // Routing kararı için yuklenenKopekler kullan (useLiveQuery değil)
  const routingKopekleri = yuklenenKopekler ?? kopekler

  return (
    <SepetProvider>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/arkadaslarim" element={<ArkadaslarimPage />} />
        <Route path="/siparisler" element={<SiparisGecmisiPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/dog/:id/*" element={<DogLayout />} />
        <Route
          path="*"
          element={
            routingKopekleri && routingKopekleri.length > 0
              ? <Navigate to={`/dog/${routingKopekleri[0].id}/map`} replace />
              : <Navigate to="/onboarding" replace />
          }
        />
      </Routes>
      {showBirthdayBalloons && (
        <Balloons onComplete={() => setShowBirthdayBalloons(false)} />
      )}
    </SepetProvider>
  )
}
