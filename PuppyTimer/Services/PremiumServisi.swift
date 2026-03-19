// =============================================================================
// PawLand macOS — PremiumServisi
// Firebase Firestore üzerinden premium durum kontrolü
// Web uygulamasıyla aynı "premiumKullanicilar" koleksiyonunu kullanır
// =============================================================================

import Foundation
import FirebaseFirestore
import FirebaseAuth

@MainActor
final class PremiumServisi: ObservableObject {

    static let shared = PremiumServisi()

    @Published var isPremium: Bool = false
    @Published var kontrolEdiliyor: Bool = false

    private let db = Firestore.firestore()
    private var dinleyici: ListenerRegistration?

    private init() {}

    // MARK: - Premium durumunu anlık dinle (onSnapshot)

    func premiumDinle() {
        guard let uid = Auth.auth().currentUser?.uid else { return }

        dinleyici?.remove()
        dinleyici = db.collection("premiumKullanicilar")
            .document(uid)
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self else { return }
                guard let data = snapshot?.data() else {
                    self.isPremium = false
                    return
                }
                let premium = data["premium"] as? Bool ?? false
                let aktif   = data["aktif"]   as? Bool ?? false
                let bitisTarihi = data["bitisTarihi"] as? Double

                if premium && aktif {
                    if let bitis = bitisTarihi {
                        self.isPremium = bitis > Double(Date().timeIntervalSince1970 * 1000)
                    } else {
                        self.isPremium = true // lifetime
                    }
                } else {
                    self.isPremium = false
                }
            }
    }

    // MARK: - Tek seferlik kontrol

    func premiumMu() async -> Bool {
        guard let uid = Auth.auth().currentUser?.uid else { return false }
        kontrolEdiliyor = true
        defer { kontrolEdiliyor = false }

        do {
            let doc = try await db.collection("premiumKullanicilar").document(uid).getDocument()
            guard let data = doc.data() else { return false }

            let premium = data["premium"] as? Bool ?? false
            let aktif   = data["aktif"]   as? Bool ?? false
            let bitisTarihi = data["bitisTarihi"] as? Double

            if premium && aktif {
                if let bitis = bitisTarihi {
                    return bitis > Double(Date().timeIntervalSince1970 * 1000)
                }
                return true
            }
            return false
        } catch {
            print("[Premium] Kontrol hatası:", error)
            return false
        }
    }

    func dinleyiciTemizle() {
        dinleyici?.remove()
        dinleyici = nil
    }
}
