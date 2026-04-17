# 🍎 Xcode iOS Setup — PuppyTimer

## Adım 1: Apple Developer Account Bağlama

1. Xcode menüsünde: **Xcode → Preferences** (⌘,)
2. **Accounts** sekmesine git
3. **+** butonuna tıkla
4. **Apple ID** seç
5. Apple ID'nizi girin (Apple Developer Program'a kayıtlı olan)
6. Apple Developer Program üyeliğini onaylayın
7. Preferences'i kapat

---

## Adım 2: Project Ayarları (Xcode Interface'de)

**⚠️ ÖNEMLI:** Package.swift kullanan bir SPM projesinde, Xcode UI tamamen desteklemeyebilir. Terminal ile build yapacağız, ama ayarları da göstereceğim.

### Seçenek A: Xcode UI (Eğer project açılırsa)

1. **Package.swift'i Xcode'da aç:**
   ```bash
   open Package.swift
   ```

2. **Scheme seçin:** 
   - Top bar'da "PuppyTimer" scheme'ini seçin
   - Destination: iPhone 15 simulator seçin

3. **Build Settings:**
   - Select target > Build Settings
   - Search "Info.plist Path" → `PuppyTimer/Info.plist`
   - Search "Code Sign Entitlements" → `PuppyTimer/PuppyTimer.entitlements`
   - Search "Bundle Identifier" → `com.pawland.app`
   - Search "Team" → Apple Developer Team ID'nizi seçin

4. **Signing & Capabilities:**
   - Target seçin
   - "Signing & Capabilities" tab'ına git
   - Team dropdown'dan Apple Team'i seçin
   - "+" button'ına tıkla → Push Notifications capability ekle

---

## Adım 3: Terminal ile Build (Tavsiye Edilen)

### 3A. iPhone Simulator'da Test Build

```bash
cd /Users/bogacaykan/Desktop/PawPaw-main

# Build for iPhone Simulator
xcodebuild build \
  -scheme PuppyTimer \
  -sdk iphonesimulator \
  -configuration Debug
```

**Eğer başarılıysa:** "BUILD SUCCESSFUL" mesajını görürsünüz.

**Eğer hata alırsanız:**
1. Mesajı okuyun
2. Sorun genellikle:
   - Info.plist Path yanlış
   - Entitlements Path yanlış
   - Bundle ID eksik
   - Firebase key expired (mutable — şimdilik test key'i kullanıyoruz)

---

### 3B. Archive (Production Build)

Apple Developer hesabı aktifse:

```bash
xcodebuild archive \
  -scheme PuppyTimer \
  -sdk iphoneos \
  -configuration Release \
  -archivePath ~/Desktop/PuppyTimer.xcarchive
```

Bu bir `.xcarchive` oluşturur. Sonra:

```bash
xcodebuild -exportArchive \
  -archivePath ~/Desktop/PuppyTimer.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath ~/Desktop/PuppyTimer-IPA
```

(ExportOptions.plist'i ayrıca oluşturmanız gerekir — aşağıda var)

---

## ExportOptions.plist (TestFlight için)

Dosya adı: `/Users/bogacaykan/Desktop/PawPaw-main/ExportOptions.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>uploadBitcode</key>
    <false/>
</dict>
</plist>
```

**NOT:** `YOUR_TEAM_ID`'yi Apple Developer account dashboard'unuzdan bulun.

---

## Adım 4: App Store Connect'e Upload

### 4A. Transporter ile Manual Upload

1. App Store Connect'te yeni app oluşturun:
   - https://appstoreconnect.apple.com/
   - Apps → "+" → "New App"
   - Bundle ID: `com.pawland.app`
   - SKU: `puppytimer_2026`

2. Xcode Organizer'dan upload edin:
   - Xcode → Window → Organizer
   - Archive seçin
   - "Distribute App" → App Store Connect

OR

3. Terminal aracılığıyla Transporter:
```bash
# macOS'taki Transporter uygulamasını aç
open /Applications/Transporter.app
```

---

## Adım 5: TestFlight

Archive App Store Connect'e upload olduktan sonra:

1. https://appstoreconnect.apple.com/ aç
2. Uygulamanıza git
3. TestFlight → Internal Testing
4. Tester ekle (email adresi)
5. Build'i seç ve "Add" butonuna tıkla
6. Tester'ı davet et

---

## Troubleshooting

### Build Error: "info.plist not found"

```bash
# Info.plist konumunu kontrol et
find . -name "Info.plist" -not -path "./.build/*"
```

Expected: `/PuppyTimer/Info.plist`

---

### Build Error: "Code Signing Entitlements"

Package.swift düzenleyin — SPM'de `.entitlements` dosyası otomatik bulunmayabilir.

```swift
// Package.swift'e ekleyin:
.executableTarget(
    name: "PuppyTimer",
    dependencies: [...],
    path: "PuppyTimer",
    linkerSettings: [
        .unsafeFlags(["-Xlinker", "-sectcreate", "-Xlinker", "__TEXT", "-Xlinker", "__entitlements", "-Xlinker", "PuppyTimer/PuppyTimer.entitlements"])
    ]
)
```

---

### Firebase Error: "Invalid googleAppID"

Firebase googleAppID şu anda macOS'a kayıtlı. iOS'ta hata alırsanız, Firebase Console'dan iOS App ID'si alın:

1. Firebase Console: https://console.firebase.google.com
2. Project: "pawland3448"
3. Settings → Project Settings
4. iOS app ID'sini kopyala
5. PuppyTimerApp.swift'te `googleAppID` değerini güncelleyin

---

## ✅ Success Checklist

- [ ] Apple Developer Account bağlandı
- [ ] Xcode'da PuppyTimer scheme görunüyor
- [ ] iPhone Simulator build başarılı
- [ ] Archive oluşturuldu
- [ ] App Store Connect'e upload başarılı
- [ ] TestFlight'ta Internal Testing'de görünüyor
- [ ] Tester davetiye gönderildi

---

**Support:** Herhangi bir sorun olursa:
1. Terminal output'u göster
2. Info.plist ve Entitlements dosyalarını kontrol et
3. Firebase credentials'ını doğrula
