import Foundation
import Security

struct AnahtarlikServisi {
    static let servisAdi = "com.puppytimer.claude-api"
    static let hesapAdi = "api-key"
    private static let yedekAnahtar = "com.puppytimer.claude-api-key"

    static func kaydet(_ anahtar: String) throws {
        let data = Data(anahtar.utf8)

        // Onceki kaydi sil
        try? sil()

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: servisAdi,
            kSecAttrAccount as String: hesapAdi,
            kSecValueData as String: data
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        if status != errSecSuccess {
            print("[AnahtarlikServisi] Keychain kaydetme hatası: \(status)")
        }

        // Yedek olarak UserDefaults'a da kaydet (SPM binary her build'de farkli imzalanir)
        let encoded = data.base64EncodedString()
        UserDefaults.standard.set(encoded, forKey: yedekAnahtar)
    }

    static func getir() -> String? {
        // Once Keychain'den dene
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: servisAdi,
            kSecAttrAccount as String: hesapAdi,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        if status == errSecSuccess, let data = result as? Data,
           let key = String(data: data, encoding: .utf8) {
            return key
        }

        // Keychain basarisiz ise UserDefaults yedeginden oku
        if let encoded = UserDefaults.standard.string(forKey: yedekAnahtar),
           let data = Data(base64Encoded: encoded),
           let key = String(data: data, encoding: .utf8), !key.isEmpty {
            return key
        }

        return nil
    }

    static func sil() throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: servisAdi,
            kSecAttrAccount as String: hesapAdi
        ]

        let status = SecItemDelete(query as CFDictionary)
        if status != errSecSuccess && status != errSecItemNotFound {
            print("[AnahtarlikServisi] Keychain silme hatası: \(status)")
        }

        UserDefaults.standard.removeObject(forKey: yedekAnahtar)
    }

    static var anahtarVarMi: Bool {
        getir() != nil
    }
}

enum AnahtarlikHatasi: Error, LocalizedError {
    case kaydetmeBasarisiz(OSStatus)
    case silmeBasarisiz(OSStatus)

    var errorDescription: String? {
        switch self {
        case .kaydetmeBasarisiz(let status):
            return "Anahtar kaydetme hatası: \(status)"
        case .silmeBasarisiz(let status):
            return "Anahtar silme hatası: \(status)"
        }
    }
}
