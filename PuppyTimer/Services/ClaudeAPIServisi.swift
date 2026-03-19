// =============================================================================
// PawLand macOS — ClaudeAPIServisi
// Artık doğrudan Anthropic'e değil, kendi Firebase Cloud Function'ımıza
// bağlanıyor. API anahtarı sunucu tarafında güvenle saklanıyor.
// Yalnızca Premium kullanıcılar bu servisi kullanabilir.
// =============================================================================

import Foundation
import FirebaseFunctions

// MARK: - Yanıt modelleri

struct KopekAnalizi: Codable {
    let irk: String
    let renk: String
    let boyut: String
    let kulakTipi: String
    let genel: String
}

struct DiskiAnalizi: Codable {
    let durum: String
    let aciklama: String
    let oneriler: [String]
    let uyariMi: Bool
}

// MARK: - Hata türü

enum ClaudeAPIHatasi: LocalizedError {
    case premiumGerekli
    case girisGerekli
    case analizBasarisiz(String)
    case jsonHatasi

    var errorDescription: String? {
        switch self {
        case .premiumGerekli:
            return "Bu özellik yalnızca Premium üyelere özeldir."
        case .girisGerekli:
            return "Bu özelliği kullanmak için giriş yapmalısınız."
        case .analizBasarisiz(let mesaj):
            return "AI analizi başarısız: \(mesaj)"
        case .jsonHatasi:
            return "Sunucudan geçersiz yanıt alındı."
        }
    }
}

// MARK: - Servis

actor ClaudeAPIServisi {

    static let shared = ClaudeAPIServisi()

    private lazy var functions: Functions = {
        Functions.functions(region: "us-central1")
    }()

    private init() {}

    // MARK: - Köpek fotoğrafı analizi

    func kopekFotoAnalizEt(fotoData: Data, mediaType: String) async throws -> KopekAnalizi {
        let base64 = fotoData.base64EncodedString()
        let sonuc = try await analizYap(base64: base64, mediaType: mediaType, tur: "dog")
        guard let json = sonuc as? [String: Any],
              let jsonData = try? JSONSerialization.data(withJSONObject: json),
              let analiz = try? JSONDecoder().decode(KopekAnalizi.self, from: jsonData)
        else { throw ClaudeAPIHatasi.jsonHatasi }
        return analiz
    }

    // MARK: - Dışkı fotoğrafı analizi

    func diskiAnalizEt(fotoData: Data, mediaType: String) async throws -> DiskiAnalizi {
        let base64 = fotoData.base64EncodedString()
        let sonuc = try await analizYap(base64: base64, mediaType: mediaType, tur: "stool")
        guard let json = sonuc as? [String: Any],
              let jsonData = try? JSONSerialization.data(withJSONObject: json),
              let analiz = try? JSONDecoder().decode(DiskiAnalizi.self, from: jsonData)
        else { throw ClaudeAPIHatasi.jsonHatasi }
        return analiz
    }

    // MARK: - Cloud Function çağrısı

    private func analizYap(base64: String, mediaType: String, tur: String) async throws -> Any {
        let params: [String: Any] = [
            "imageBase64": base64,
            "mediaType": mediaType,
            "analysisType": tur,
        ]

        do {
            let result = try await functions.httpsCallable("analyzeAI").call(params)
            guard let data = result.data as? [String: Any],
                  let sonuc = data["result"]
            else { throw ClaudeAPIHatasi.jsonHatasi }
            return sonuc
        } catch let error as NSError {
            let mesaj = error.localizedDescription
            if mesaj.contains("permission-denied") {
                throw ClaudeAPIHatasi.premiumGerekli
            }
            if mesaj.contains("unauthenticated") {
                throw ClaudeAPIHatasi.girisGerekli
            }
            throw ClaudeAPIHatasi.analizBasarisiz(mesaj)
        }
    }
}
