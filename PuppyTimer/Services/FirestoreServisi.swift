// =============================================================================
// PawLand macOS — FirestoreServisi
// SwiftData ↔ Firebase Firestore çift yönlü senkronizasyon
// =============================================================================

import Foundation
import FirebaseFirestore
import FirebaseAuth
import SwiftData

// MARK: - Firebase yapılandırması

/// GoogleService-Info.plist dosyasını projeye ekleyin ve bu sabit kullanılır.
/// Alternatif olarak manuel olarak aşağıdaki değerleri doldurabilirsiniz.
let FIREBASE_PROJECT_ID = "pawland3448"

// MARK: - Firestore koleksiyon adları (web ile aynı)

private enum Koleksiyon {
    static let kopekler     = "kopekler_mac"        // macOS'a özel koleksiyon
    static let saglikNotlari = "saglikNotlari_mac"
    static let asiKayitlari = "asiKayitlari_mac"
    static let ilaçTakibi   = "ilacTakibi_mac"
    static let yuruyusler   = "yuruyusler_mac"
    static let tuvaletler   = "tuvaletler_mac"
    static let kullanicilar = "kullanicilar"
}

// MARK: - FirestoreServisi

@MainActor
final class FirestoreServisi: ObservableObject {

    static let shared = FirestoreServisi()

    private let db = Firestore.firestore()
    @Published var baglanti: Bool = false
    @Published var kullaniciBilgisi: [String: Any]? = nil

    private var dinleyiciler: [ListenerRegistration] = []

    private init() {}

    // ── Kimlik doğrulama ────────────────────────────────────────────────────

    /// Anonim oturum açar (web ile aynı yöntem)
    func anonimGirisYap() async {
        guard Auth.auth().currentUser == nil else {
            baglanti = true
            return
        }
        do {
            try await Auth.auth().signInAnonymously()
            baglanti = true
        } catch {
            print("[Firestore] Anonim giriş hatası:", error)
        }
    }

    var kullaniciId: String {
        Auth.auth().currentUser?.uid ?? ""
    }

    // ── Köpek senkronizasyonu ────────────────────────────────────────────────

    /// Yeni köpek ekle (Firestore + local SwiftData)
    func kopekEkle(isim: String, irk: String, dogumTarihi: Date?, cins: String, context: ModelContext) async {
        guard !kullaniciId.isEmpty else { return }

        let veri: [String: Any] = [
            "isim": isim,
            "irk": irk,
            "dogumTarihi": dogumTarihi.map { Timestamp(date: $0) } as Any,
            "cins": cins,
            "sahipId": kullaniciId,
            "olusturmaTarihi": Timestamp(date: Date()),
            "guncellenmeTarihi": Timestamp(date: Date()),
        ]

        do {
            let ref = try await db.collection("\(Koleksiyon.kopekler)/\(kullaniciId)/kopekler").addDocument(data: veri)

            let kopek = Kopek(
                isim: isim,
                irk: irk,
                dogumTarihi: dogumTarihi ?? Date(),
                cinsiyet: cins,
                firestoreId: ref.documentID
            )
            context.insert(kopek)
            try context.save()
        } catch {
            print("[Firestore] Köpek eklenirken hata:", error)
        }
    }

    /// Kullanıcının tüm köpeklerini Firestore'dan çek ve local'e kaydet
    func kopekleriSenkronize(context: ModelContext) async {
        guard !kullaniciId.isEmpty else { return }

        do {
            let snapshot = try await db
                .collection("\(Koleksiyon.kopekler)/\(kullaniciId)/kopekler")
                .getDocuments()

            for doc in snapshot.documents {
                let veri = doc.data()
                let firestoreId = doc.documentID

                // Zaten varsa güncelle, yoksa ekle
                var descriptor = FetchDescriptor<Kopek>(
                    predicate: #Predicate { $0.firestoreId == firestoreId }
                )
                descriptor.fetchLimit = 1

                if let mevcutKopek = try context.fetch(descriptor).first {
                    mevcutKopek.isim = veri["isim"] as? String ?? mevcutKopek.isim
                    mevcutKopek.irk  = veri["irk"]  as? String ?? mevcutKopek.irk
                } else {
                    let yeniKopek = Kopek(
                        isim: veri["isim"] as? String ?? "İsimsiz",
                        irk:  veri["irk"]  as? String ?? "",
                        dogumTarihi: (veri["dogumTarihi"] as? Timestamp)?.dateValue() ?? Date(),
                        cinsiyet: veri["cins"] as? String ?? "erkek",
                        firestoreId: firestoreId
                    )
                    context.insert(yeniKopek)
                }
            }
            try context.save()
        } catch {
            print("[Firestore] Köpek senkronizasyon hatası:", error)
        }
    }

    // ── Sağlık notu senkronizasyonu ──────────────────────────────────────────

    func saglikNotuEkle(kopekId: String, baslik: String, icerik: String, context: ModelContext) async {
        guard !kullaniciId.isEmpty else { return }

        let veri: [String: Any] = [
            "kopekId": kopekId,
            "baslik": baslik,
            "icerik": icerik,
            "sahipId": kullaniciId,
            "tarih": Timestamp(date: Date()),
        ]

        do {
            let ref = try await db
                .collection("\(Koleksiyon.saglikNotlari)/\(kullaniciId)/notlar")
                .addDocument(data: veri)

            let not = SaglikNotu(
                baslik: baslik,
                aciklama: icerik,
                tarih: Date(),
                firestoreId: ref.documentID
            )
            context.insert(not)
            try context.save()
        } catch {
            print("[Firestore] Sağlık notu eklenirken hata:", error)
        }
    }

    // ── Anlık dinleyiciler ────────────────────────────────────────────────────

    /// Harita için online köpek konumlarını dinle (topluluk özelliği)
    func haritaKonumlariniDinle(
        callback: @escaping ([[String: Any]]) -> Void
    ) {
        let listener = db.collection("haritaIsaretciler")
            .whereField("aktif", isEqualTo: true)
            .addSnapshotListener { snapshot, error in
                guard let docs = snapshot?.documents else { return }
                let veriler = docs.map { $0.data() }
                callback(veriler)
            }
        dinleyiciler.append(listener)
    }

    /// Topluluk chat mesajlarını dinle
    func chatMesajlariniDinle(
        callback: @escaping ([[String: Any]]) -> Void
    ) {
        let listener = db.collection("toplulukMesajlari")
            .whereField("aktif", isEqualTo: true)
            .order(by: "tarih", descending: false)
            .limit(to: 100)
            .addSnapshotListener { snapshot, error in
                guard let docs = snapshot?.documents else { return }
                let veriler = docs.map { $0.data() }
                callback(veriler)
            }
        dinleyiciler.append(listener)
    }

    /// Chat mesajı gönder
    func chatMesajiGonder(mesaj: String, gonderenAd: String) async {
        guard !kullaniciId.isEmpty else { return }
        let veri: [String: Any] = [
            "gonderenId": kullaniciId,
            "gonderenAd": gonderenAd,
            "mesaj": mesaj,
            "tarih": Timestamp(date: Date()),
            "aktif": true,
            "platform": "macOS",
        ]
        do {
            try await db.collection("toplulukMesajlari").addDocument(data: veri)
        } catch {
            print("[Firestore] Mesaj gönderme hatası:", error)
        }
    }

    /// Kullanıcı konumunu haritaya kaydet/güncelle
    func konumGuncelle(enlem: Double, boylam: Double, kopekAdi: String) async {
        guard !kullaniciId.isEmpty else { return }
        let veri: [String: Any] = [
            "uid": kullaniciId,
            "kopekAdi": kopekAdi,
            "enlem": enlem,
            "boylam": boylam,
            "guncellenmeTarihi": Timestamp(date: Date()),
            "aktif": true,
            "platform": "macOS",
        ]
        do {
            try await db.collection("haritaIsaretciler")
                .document(kullaniciId)
                .setData(veri, merge: true)
        } catch {
            print("[Firestore] Konum güncelleme hatası:", error)
        }
    }

    // ── Mağaza ──────────────────────────────────────────────────────────────

    func aktifUrunleriGetir() async -> [[String: Any]] {
        do {
            let snapshot = try await db.collection("urunler")
                .whereField("aktif", isEqualTo: true)
                .getDocuments()
            return snapshot.documents.map { ["id": $0.documentID] + $0.data() }
        } catch {
            print("[Firestore] Ürün getirme hatası:", error)
            return []
        }
    }

    func siparisOlustur(urunler: [[String: Any]], teslimatAdresi: String) async throws {
        guard !kullaniciId.isEmpty else { return }
        let veri: [String: Any] = [
            "kullaniciId": kullaniciId,
            "urunler": urunler,
            "teslimatAdresi": teslimatAdresi,
            "durum": "beklemede",
            "tarih": Timestamp(date: Date()),
            "platform": "macOS",
        ]
        try await db.collection("siparisler").addDocument(data: veri)
    }

    // ── Temizlik ─────────────────────────────────────────────────────────────

    func dinleyicileriTemizle() {
        dinleyiciler.forEach { $0.remove() }
        dinleyiciler.removeAll()
    }
}

// MARK: - Kopek modeline Firestore ID ekle
// Not: Kopek.swift dosyasına @Attribute olarak eklenmeli
extension Kopek {
    var firestoreId: String {
        get { UserDefaults.standard.string(forKey: "firestoreId_\(id ?? 0)") ?? "" }
        set { UserDefaults.standard.set(newValue, forKey: "firestoreId_\(id ?? 0)") }
    }

    convenience init(isim: String, irk: String, dogumTarihi: Date, cinsiyet: String, firestoreId: String) {
        self.init(isim: isim, irk: irk, dogumTarihi: dogumTarihi, cinsiyet: cinsiyet)
        self.firestoreId = firestoreId
    }
}
