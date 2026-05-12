# PuppyTimer Store Publish Checklist

Bu dosya, App Store ve Google Play yayinina cikmadan once kapatilmasi gereken maddeleri takip etmek icin olusturuldu.

## Apple (Native Swift App)

- [x] `Info.plist` XML hatasi duzeltildi.
- [x] `ITSAppUsesNonExemptEncryption` eklendi.
- [x] `Assets.xcassets` + `AppIcon.appiconset` eklendi (1024 dahil).
- [x] Uygulama ici "Gizlilik Politikasi" ve "Kullanim Kosullari" linkleri eklendi.
- [x] Web uzerinden premium satin alma yonlendirmesi kaldirildi (IAP hazirlik durumuna alindi).
- [x] `Package.swift` iOS platformunu kapsayacak sekilde guncellendi (`iOS 17+`).

- [ ] Apple Team ID (`ExportOptions.plist`) girilecek.
- [ ] StoreKit IAP entegrasyonu (urunler, satin alma, restore, receipt doğrulama) tamamlanacak.
- [ ] App Store Connect urun metadata ve ekran goruntuleri yüklenecek.
- [ ] Gercek cihazda iOS derleme + arsiv alma dogrulanacak.

## Google Play (Android via Capacitor)

- [x] `colors.xml` eklendi.
- [x] `splash.xml` eklendi.
- [x] Adaptive icon foreground referansi duzeltildi.
- [x] Release signing sifreleri repodan cikarildi (env degiskenleri kullaniliyor).

- [ ] `google-services.json` eklenecek.
- [ ] CI/local ortamda signing env degiskenleri tanimlanacak:
  - `PAWLAND_KEYSTORE_PATH`
  - `PAWLAND_STORE_PASSWORD`
  - `PAWLAND_KEY_ALIAS`
  - `PAWLAND_KEY_PASSWORD`
- [ ] Keystore dosyasi guvenli sekilde saglanacak.
- [ ] Java/Android SDK ile release build alinip dogrulanacak.

## Web/PWA (Destekleyici)

- [x] `icon-192.png`, `icon-512.png`, `pawlandlogo.png` dosyalari eklendi.
- [x] `sw.js` icin no-cache header eklendi.
- [x] `.env` dosyalari `.gitignore`'a eklendi.

## Security / Compliance

- [x] Firestore `kullaniciCezalar` yazma yetkisi admin ile sinirlandi.
- [x] Cakisan/yinelenen Firestore rule bloklari temizlendi.

- [ ] Firestore rule'lari emulator testleri ile regresyon testinden gececek.
- [ ] Play Console Data Safety formu doldurulacak.
- [ ] App Store privacy questionnaire doldurulacak.
