# iOS App Wrapper Setup — Manual Steps

## Problem
Swift Package Manager's executable target PuppyTimer macOS olarak deklarlanmış olsa bile, iOS Simulator destination'ı Xcode tarafından otomatik oluşturulmadı.

## Solution: Xcode'da Manual iOS App Project Oluşturmak

Xcode açık mı? Şu adımları yapın:

### **1. File → New → Project**
   - iOS → App seçin
   - Next

### **2. Project Details**
   - **Product Name:** PuppyTimer-iOS
   - **Team:** Apple Developer Team'i seçin
   - **Organization Identifier:** com.pawland
   - **Bundle Identifier:** com.pawland.app (auto-populated)
   - **Language:** Swift
   - **UI:** SwiftUI
   - **Organization Identifier:** Blank OK
   - Next

### **3. Save Location**
   - Desktop (veya istenen yer) → Create

### **4. Yeni iOS App Project Oluşturulacak**

Bu project'i oluşturduktan sonra:

1. Package.swift source'larını import edeceğiz
2. Existing PuppyTimer package'ını dependency ekleyeceğiz
3. Build & Test yapacağız

---

## Alternative: Swift Package'ın Kendi İçinden iOS App Oluşturmak

Package.swift'e `.library` target eklemek ve `@main` app entrypoint'i ayrı `executableTarget`'ta tutmak:

```swift
let package = Package(
    name: "PuppyTimer",
    platforms: [
        .iOS(.v15),
        .macOS(.v14)
    ],
    products: [
        .library(name: "PuppyTimerLib", targets: ["PuppyTimerLib"]),
        .executable(name: "PuppyTimer", targets: ["PuppyTimerApp"]),
    ],
    // ... dependencies ...
    targets: [
        .target(
            name: "PuppyTimerLib",
            dependencies: [/* ... */],
            path: "PuppyTimer"
        ),
        .executableTarget(
            name: "PuppyTimerApp",
            dependencies: ["PuppyTimerLib"],
            path: "PuppyTimerApp"
        ),
    ]
)
```

Bu çok refactoring gerektirir...

---

## Most Practical: Use Xcode UI Directly

1. Xcode menüsünde: **Product → Scheme → Edit Scheme**
2. Info sekmesinde:
   - Executable: None (App Wrapper'a izin ver)
   - Launch: Automatically
3. Build & Run (Cmd + R)

Xcode size iOS Simulator ile build et demeyi zorlamalı...

---

## For Now: Let's Do It in Xcode UI

1. Xcode window'u open mı?
2. Package.swift file navigator'de görünüyor mu?
3. Xcode menüsü: Product → Scheme → PuppyTimer seçin
4. Scheme dropdown'un sağında: "My Mac" → tıkla, "Any iOS Device" or "iPhone 15 Simulator" seç

Eğer "iPhone 15 Simulator" burada yoksa:
- Xcode > Preferences > Locations > Command Line Tools = latest version

Sonra:
- Product → Build (Cmd + B)

---

## Expected Errors & Fixes

### "iOS 26.2 not installed"
→ Xcode iOS SDK 26.2 missing
→ Xcode Preferences > Components > iOS 26.2 download

### "No destination found"
→ Simulator yoklama
→ Terminal: `xcrun simctl list`

### "@main not supported"
→ Executable target sadece macOS/Linux'de destekleniyor
→ Library + Wrapper app pattern gerekli

---

## Next Step After Manual Setup

Once Simulator build succeeds:
1. Test the app in Simulator
2. Product → Build for (iphoneos) → Archive
3. App Store Connect submit
4. TestFlight

