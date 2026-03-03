import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/database'
import BottomTabBar from './components/layout/BottomTabBar'
import DogDropdown from './components/layout/DogDropdown'
import { SepetProvider } from './contexts/SepetContext'
import { useState, useEffect, useRef, lazy, Suspense } from 'react'

// Lazy-loaded pages — her sayfa ayrı bir chunk'a bölünür
// Bu sayede başlangıç bundle'ı küçülür, üç.js ve leaflet sadece ilgili sayfada yüklenir
const OnboardingPage    = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })))
const DogProfilePage    = lazy(() => import('./pages/DogProfilePage').then(m => ({ default: m.DogProfilePage })))
const TimersPage        = lazy(() => import('./pages/TimersPage').then(m => ({ default: m.TimersPage })))
const WalksPage         = lazy(() => import('./pages/WalksPage').then(m => ({ default: m.WalksPage })))
const ToiletPage        = lazy(() => import('./pages/ToiletPage').then(m => ({ default: m.ToiletPage })))
const HealthPage        = lazy(() => import('./pages/HealthPage').then(m => ({ default: m.HealthPage })))
const MapPage           = lazy(() => import('./pages/MapPage').then(m => ({ default: m.MapPage })))
const BakimTakvimiPage  = lazy(() => import('./pages/BakimTakvimiPage').then(m => ({ default: m.BakimTakvimiPage })))
const EgitimTrackerPage = lazy(() => import('./pages/EgitimTrackerPage').then(m => ({ default: m.EgitimTrackerPage })))
const BasarilarPage     = lazy(() => import('./pages/BasarilarPage').then(m => ({ default: m.BasarilarPage })))
const TakvimPage        = lazy(() => import('./pages/TakvimPage').then(m => ({ default: m.TakvimPage })))
const MenuPage          = lazy(() => import('./pages/MenuPage').then(m => ({ default: m.MenuPage })))
const PhotoGalleryPage  = lazy(() => import('./pages/PhotoGalleryPage').then(m => ({ default: m.PhotoGalleryPage })))
const StatsPage         = lazy(() => import('./pages/StatsPage').then(m => ({ default: m.StatsPage })))
const ShopPage          = lazy(() => import('./pages/ShopPage').then(m => ({ default: m.ShopPage })))
const UrunDetayPage     = lazy(() => import('./pages/UrunDetayPage'))
const LoginPage         = lazy(() => import('./pages/LoginPage'))
const RegisterPage      = lazy(() => import('./pages/RegisterPage'))
const SettingsPage      = lazy(() => import('./pages/SettingsPage'))
const ArkadaslarimPage  = lazy(() => import('./pages/ArkadaslarimPage').then(m => ({ default: m.ArkadaslarimPage })))
const AdminPage         = lazy(() => import('./pages/AdminPage'))
const SiparisGecmisiPage = lazy(() => import('./pages/SiparisGecmisiPage'))
const GiderTakibiPage   = lazy(() => import('./pages/GiderTakibiPage').then(m => ({ default: m.GiderTakibiPage })))
const HatirlaticiPage   = lazy(() => import('./pages/HatirlaticiPage').then(m => ({ default: m.HatirlaticiPage })))
const RandevuPage       = lazy(() => import('./pages/RandevuPage').then(m => ({ default: m.RandevuPage })))
import { Settings, Users, X as XIcon, Bell } from 'lucide-react'
import { authDinle } from './services/authService'
import { alarmKontrolEt, TUR_EMOJI } from './services/hatirlaticiService'
import type { Hatirlatici } from './types/models'
import type { User } from 'firebase/auth'
import { useArkadasViewModel } from './hooks/useArkadasViewModel'
import { kopekleriFirestoreDanYukle, firestoreDegisiklikleriniDinle } from './services/kopekSenkronizasyon'
import Balloons from './components/common/Balloons'
import { bugunDogumGunuMu } from './services/dateUtils'
import { getLastSelectedDog, saveLastSelectedDog } from './services/dogSelectionService'

// Sayfa yüklenirken gösterilen minimal loading göstergesi
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
    </div>
  )
}

function DogLayout() {
  const { id } = useParams()
  const kopekId = Number(id)
  const navigate = useNavigate()
  const location = useLocation()
  const isMapPage = location.pathname.endsWith('/map')
  const kopekler = useLiveQuery(() => db.kopekler.orderBy('ad').toArray()) ?? []
  const arkadasVM = useArkadasViewModel()
  const [aktifAlarm, setAktifAlarm] = useState<Hatirlatici | null>(null)

  const handleSelectDog = (dogId: number) => {
    saveLastSelectedDog(dogId);
    navigate(`/dog/${dogId}/map`);
  };

  // Her 30 saniyede hatırlatıcı alarmlarını kontrol et
  useEffect(() => {
    if (!kopekId) return
    const kontrol = () => {
      const alarm = alarmKontrolEt(kopekId)
      if (alarm) setAktifAlarm(alarm)
    }
    kontrol()
    const interval = setInterval(kontrol, 30_000)
    return () => clearInterval(interval)
  }, [kopekId])

  // kopekler yüklendikten sonra geçersiz kopek ID'sini yönlendir
  const kopekMevcut = kopekler.some(k => k.id === kopekId)
  if (!kopekMevcut && kopekler.length > 0) {
    return <Navigate to={`/dog/${kopekler[0].id}/map`} replace />
  }

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* Hatırlatıcı Alarm Banner */}
      {aktifAlarm && (
        <div className="relative z-[1200] bg-orange-500 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
          <Bell size={18} className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight">Hatırlatıcı! {TUR_EMOJI[aktifAlarm.tur] || '🔔'}</p>
            <p className="text-xs text-orange-100 truncate">{aktifAlarm.baslik}</p>
          </div>
          <button
            onClick={() => setAktifAlarm(null)}
            className="p-1 hover:bg-white/20 rounded-full flex-shrink-0"
          >
            <XIcon size={18} />
          </button>
        </div>
      )}
      <div className="relative z-[1100] flex items-center gap-2 px-4 pt-3 pb-2 bg-white border-b border-gray-100">
        <DogDropdown
          dogs={kopekler}
          selectedId={kopekId}
          onSelect={handleSelectDog}
          onAdd={() => navigate('/onboarding')}
        />
        <div className="flex items-center gap-1 flex-shrink-0">
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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route index element={<DogProfilePage kopekId={kopekId} />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="shop/urun/:urunId" element={<UrunDetayPage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="timers" element={<TimersPage kopekId={kopekId} />} />
            <Route path="walks" element={<WalksPage kopekId={kopekId} />} />
            <Route path="toilet" element={<ToiletPage kopekId={kopekId} />} />
            <Route path="health" element={<HealthPage kopekId={kopekId} />} />
            <Route path="grooming" element={<BakimTakvimiPage />} />
            <Route path="training" element={<EgitimTrackerPage />} />
            <Route path="map" element={<MapPage kopekId={kopekId} />} />
            <Route path="calendar" element={<TakvimPage kopekId={kopekId} />} />
            <Route path="gallery" element={<PhotoGalleryPage kopekId={kopekId} />} />
            <Route path="stats" element={<StatsPage kopekId={kopekId} />} />
            <Route path="achievements" element={<BasarilarPage />} />
            <Route path="expenses" element={<GiderTakibiPage />} />
            <Route path="reminders" element={<HatirlaticiPage />} />
            <Route path="appointments" element={<RandevuPage />} />
          </Routes>
        </Suspense>
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

  // Son seçilen köpeği localStorage'dan al, yoksa ilk köpeği kullan
  const getDefaultDogId = () => {
    if (!routingKopekleri || routingKopekleri.length === 0) return null;

    const lastSelected = getLastSelectedDog();
    const lastSelectedExists = routingKopekleri.some(k => k.id === lastSelected);

    if (lastSelected && lastSelectedExists) {
      return lastSelected;
    }

    return routingKopekleri[0].id;
  };

  return (
    <SepetProvider>
      <Suspense fallback={<PageLoader />}>
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
                ? <Navigate to={`/dog/${getDefaultDogId()}/map`} replace />
                : <Navigate to="/onboarding" replace />
            }
          />
        </Routes>
      </Suspense>
      {showBirthdayBalloons && (
        <Balloons onComplete={() => setShowBirthdayBalloons(false)} />
      )}
    </SepetProvider>
  )
}
