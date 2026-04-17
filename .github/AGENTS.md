# 🐕 PuppyTimer - Custom Agents

Bu dosya PuppyTimer projesinin custom development ajanlarını tanımlar. Her ajan belirli bir teknoloji alanına uzmanlaşmıştır.

## Kullanılabilir Ajanlar

### 1. **Frontend Agent** 🎨
**Komut:** `@frontend` veya "Frontend for React/TypeScript"

React/TypeScript web uygulamasını geliştirmek için:
- React components ve hooks
- TypeScript types
- CSS animasyonları
- State management
- Web services ve APIs

**Dosyalar:** `.github/agents/frontend.agent.md`

### 2. **Backend Agent** ⚙️
**Komut:** `@backend` veya "Backend for Firebase Functions"

Firebase Cloud Functions ve Node.js backend'i geliştirmek için:
- Cloud Functions (TypeScript)
- API endpoints
- Authentication & security
- Firestore logic
- Email/notifications
- AI integration (Claude)

**Dosyalar:** `.github/agents/backend.agent.md`

### 3. **iOS Agent** 📱
**Komut:** `@ios` veya "iOS development with Swift"

Swift/SwiftUI iOS uygulamasını geliştirmek için:
- SwiftUI Views
- ViewModels (MVVM)
- Services
- iOS-specific logic
- Photo handling
- Notifications

**Dosyalar:** `.github/agents/ios.agent.md`

### 4. **Database Agent** 🗄️
**Komut:** `@database` veya "Database Firestore design"

Firestore veritabanını tasarlamak ve optimize etmek için:
- Collection schemas
- Security rules
- Indexes
- Query optimization
- Data models
- Migration plans

**Dosyalar:** `.github/agents/database.agent.md`

## Nasıl Kullanılır?

### VS Code'da:
1. Chat'i aç (Ctrl+Shift+I)
2. Başında `@frontend`, `@backend`, `@ios` veya `@database` ile başla
3. Görevin açıklamasını yaz

### Örnekler:

```
@frontend
ToiletPage.tsx'e yeni bir "Sağlık Uyarısı" kartı ekle - 
aynı stilde diğer kartlarla tutarlı olsun
```

```
@backend
Köpek sağlık notları için yeni Cloud Function yaz:
- deleteHealthNote fonksiyonu
- Firestore'dan veri sil ve log tut
```

```
@ios
PuppyTimerApp.swift'te dark mode support ekle
```

```
@database
Sağlık notları için yeni Firestore collection schema tasarla
```

## Ajan Seçim Rehberi

| İş | Ajan | Neden |
|----|------|-------|
| Component düzeltme | Frontend | React/TS konusunda uzman |
| API endpoint ekleme | Backend | Cloud Functions konusunda uzman |
| iOS UI yapıştırma | iOS | Swift/SwiftUI konusunda uzman |
| Firestore query yavaş | Database | Schema optimization konusunda uzman |
| Hem frontend hem backend | Sırasıyla çağır | Alanlar ayrılmış, konteks net kalır |

## Ajan Ayarları

Tüm ajanlar:
- ✅ Workspace'te önceden yapılandırılmış
- ✅ Otomatik context isolation
- ✅ Type-safe tool access
- ✅ Kod stil consistency

## Tips & Tricks

1. **Parallel Tasks:** Farklı alanlar → farklı ajanları paralel çağır
   ```
   @frontend UI güncelle
   @backend API yaz  
   @ios View'i bağla
   ```

2. **Detailed Context:** Olabildiğince detaylı açıkla
   ```
   IYZYI: @frontend Tuvalet analizinde "Uyarılı durumlar" için mor alert göster
   İYİ: @frontend Kırmızı/turuncu durumlar yerine mor alert göster
   ```

3. **File References:** Dosya yollarını açıkça belirt
   ```
   @frontend PuppyTimerWeb/src/pages/ToiletPage.tsx'de...
   ```

## Ajan Sınırları

Her ajan kendi alanında güçlü ama:
- 🚫 Frontend → Backend veya iOS'ye dokunmaz
- 🚫 Backend → Frontend veya database design yapmaz
- 🚫 iOS → Web veya backend koduna karışmaz
- 🚫 Database → Application logic'e dokunmaz

Bu ayrılığı kullanarak, context temiz ve focused kalır!

## Troubleshooting

**Ajan yanıt vermiyor?**
- Komut başına `@agentname` yazınız
- Açıklamada "Use when..." trigger keywords kullanın

**Yanlış ajan seçildi?**
- Açıklama kısmında daha specific ol
- Dosya yolu görmek için tam path ver

---

**Yapılandırma Dosyaları:** `.github/agents/*.agent.md`  
**Son Update:** Mart 2026
