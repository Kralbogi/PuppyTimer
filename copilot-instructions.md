# 🐕 PuppyTimer Project Instructions

Bu dosya PuppyTimer proJesinde çalışan geliştiricilere rehberlik sağlar.

## 📋 Proje Özeti

**PuppyTimer** - Köpek bakım ve topluluk platformu

- **Frontend:** React + TypeScript (Web)
- **Backend:** Firebase Cloud Functions + Node.js
- **Mobile:** SwiftUI + Swift (iOS)
- **Database:** Firestore

## 🤖 Custom Ajanları Kullan

Bu projede 4 custom ajan var - her biri belirli alana uzmanlaşmış:

### Ajanları Çağırmak
```
@frontend   - React/TypeScript web development
@backend    - Firebase Functions & APIs
@ios        - Swift/SwiftUI iOS app
@database   - Firestore schema & rules
```

**Detaylı bilgi:** `.github/AGENTS.md` dosyasını oku

## 🎯 Proje Yapısı

```
PuppyTimer-main/
├── PuppyTimer/              ← iOS app (Swift) [@ios]
├── PuppyTimerWeb/           ← Web app (React) [@frontend]
│   ├── src/
│   ├── functions/           ← Backend APIs [@backend]
│   └── package.json
├── functions/               ← Cloud Functions [@backend]
├── firebase.json            ← Firestore config [@database]
└── .github/agents/          ← Custom agents
```

## 🚀 Hızlı Başlangıç

### Frontend Geliştirme
```bash
cd PuppyTimerWeb
npm install
npm run dev
```
**Ajan:** `@frontend` kullan

### Backend/Functions Yerel Test
```bash
cd functions
npm install
npm run dev  # Firebase emulator
```
**Ajan:** `@backend` kullan

### iOS Geliştirme
Xcode'da `PuppyTimer.xcodeproj` aç

**Ajan:** `@ios` kullan

## 📝 Naming Conventions

### TypeScript/React
- Components: `PascalCase` (e.g., `ToiletPage.tsx`)
- Functions/hooks: `camelCase` (e.g., `useTuvaletViewModel`)
- Types: `PascalCase` (e.g., `interface KopekAnalizi`)
- Files: kebab-case veya PascalCase

### Swift
- Types/Classes: `PascalCase`
- Functions/variables: `camelCase` veya `ÖzelsOzellestir`
- Files: PascalCase matching class name

### Firestore
- Collections: `lowercase_plural` (e.g., `kopekler`, `tuvalet_kaydi`)
- Fields: `camelCase` (e.g., `kopekId`, `olusturulmaTarihi`)

## 🔐 Security Guidelines

⚠️ **Firebase Rules:** `.database.firebase.com/rules` checklist
- ✅ Authentication always required for writes
- ✅ User data: `request.auth.uid == doc.userId`
- ✅ Public reads only anonymous features

⚠️ **API Keys:** `.env` dosyasında sakla, Git'e commit etme
- ✅ `.env` local only
- ✅ `.env.example` → template

⚠️ **Sensitive Operations:** Backend's (Node.js) yap, frontend'de yapma
- ✅ Token validation
- ✅ Premium checks
- ✅ Payment processing

## 🧪 Testing

**Frontend:** Jest/React Testing Library (setup gerekli)  
**Backend:** Jest (Cloud Functions)  
**iOS:** XCTest

**Ajan önerisi:** Bug tür'ü belirt, ajan test yazıp debug edecek

## 📚 Important Services

### Frontend Services
- `claudeApi.ts` - AI analysis (Claude)
- `firebaseService.ts` - Firestore client
- `mesajService.ts` - Chat/messages
- `arkadasService.ts` - Friend features

### Backend Functions
- `analyzeAI` - Foto analizi (köpek, dışkı)
- `deleteData` - User data deletion
- `sendNotification` - Push notifications

### Firestore Collections
- `kopekler` - Dog profiles
- `tuvalet_kaydi` - Toilet logs
- `saglik_notlari` - Health notes
- `konusma` - Chat conversations
- `topluluk_kopekler` - Community dogs

## 💡 Best Practices

1. **Ajanları optimal kullan:** Farklı alanlar → farklı ajanlar
   ```
   ❌ YAPMA: "tüm proje yapısını kayıt et"
   ✅ YAP: "@frontend: UI comp yaz", "@backend: API yaz" (ayrı)
   ```

2. **Kontekst verin:** Dosya yolları, bağlam, beklentiler
   ```
   ✅ "ToiletPage.tsx'de başarılı analiz sonrası yeşil ✓ göster"
   ❌ "sayfa'da başarı göster"
   ```

3. **Küçük, focused tasalar:** 
   - 1 feature = 1 ajan çağrısı
   - Çok kompleks? 2-3 çağrı yap

4. **Error handling:** Tüm ajanlar error handling yapsın
   ```typescript
   try { ... } catch(e) { console.error(...); toast.error(...); }
   ```

5. **TypeScript strict mode:** Her zaman aktif tut
   ```json
   "strict": true
   ```

## 🔄 Workflow

Tipik geliştirme akışı:

1. **Feature planlama** → açıkla
2. **Backend yazma** → `@backend` API yaz
3. **Frontend yazma** → `@frontend` UI + hooks yaz
4. **iOS yazma** (ihtiyacsa) → `@ios` Swift View yaz
5. **Database check** (ihtiyacsa) → `@database` schema verify
6. **Test** → ajanlardan test yazmasını iste
7. **Deploy** → Firebase/Xcode yerel test

## 🐛 Debugging

**Frontend:** DevTools (F12) + Copilot Chat
**Backend:** Firebase Functions logs → Copilot Chat
**iOS:** Xcode Console → Copilot Chat
**Database:** Firestore Console → `@database` ajan
