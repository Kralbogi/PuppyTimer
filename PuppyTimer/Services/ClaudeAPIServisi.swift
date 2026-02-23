import Foundation
import AppKit

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

enum ClaudeAPIHatasi: Error, LocalizedError {
    case apiAnahtariYok
    case agHatasi(String)
    case parseHatasi
    case gecersizYanit(String)

    var errorDescription: String? {
        switch self {
        case .apiAnahtariYok:
            return "Claude API anahtarı bulunamadı. Ayarlar'dan ekleyin."
        case .agHatasi(let mesaj):
            return "Ağ hatası: \(mesaj)"
        case .parseHatasi:
            return "API yanıtı işlenemedi."
        case .gecersizYanit(let mesaj):
            return "Geçersiz yanıt: \(mesaj)"
        }
    }
}

actor ClaudeAPIServisi {
    static let shared = ClaudeAPIServisi()

    private let baseURL = "https://api.anthropic.com/v1/messages"
    private let model = "claude-sonnet-4-5-20250929"
    private let apiVersion = "2023-06-01"

    // MARK: - Kopek Foto Analizi

    func kopekFotoAnalizEt(fotoData: Data) async throws -> KopekAnalizi {
        let base64 = fotoData.base64EncodedString()
        let mediaType = gorselTuruTespit(fotoData)

        let mesajlar: [[String: Any]] = [
            [
                "role": "user",
                "content": [
                    [
                        "type": "image",
                        "source": [
                            "type": "base64",
                            "media_type": mediaType,
                            "data": base64
                        ]
                    ],
                    [
                        "type": "text",
                        "text": """
                        Bu köpek fotoğrafını analiz et. Aşağıdaki JSON formatında yanıt ver, başka bir şey yazma:
                        {
                            "irk": "köpek ırkı (örn: Golden Retriever, Labrador, Karışık)",
                            "renk": "tüy rengi (örn: sarı, siyah, beyaz, kahverengi)",
                            "boyut": "küçük/orta/büyük",
                            "kulakTipi": "dik/sarkık/yarı-dik",
                            "genel": "köpek hakkında kısa bir Türkçe açıklama (1-2 cümle)"
                        }
                        """
                    ]
                ]
            ]
        ]

        let yanit = try await istekGonder(mesajlar: mesajlar)
        return try yanitParsele(yanit, tur: KopekAnalizi.self)
    }

    // MARK: - Diski Foto Analizi

    func diskiAnalizEt(fotoData: Data) async throws -> DiskiAnalizi {
        let base64 = fotoData.base64EncodedString()
        let mediaType = gorselTuruTespit(fotoData)

        let mesajlar: [[String: Any]] = [
            [
                "role": "user",
                "content": [
                    [
                        "type": "image",
                        "source": [
                            "type": "base64",
                            "media_type": mediaType,
                            "data": base64
                        ]
                    ],
                    [
                        "type": "text",
                        "text": """
                        Bu bir köpek dışkısı fotoğrafıdır. Veteriner sağlık perspektifinden analiz et.
                        Aşağıdaki JSON formatında yanıt ver, başka bir şey yazma:
                        {
                            "durum": "normal/dikkat/acil",
                            "aciklama": "Dışkının durumu hakkında Türkçe açıklama (2-3 cümle)",
                            "oneriler": ["öneri 1", "öneri 2"],
                            "uyariMi": true/false
                        }

                        Dikkat edilecekler:
                        - Renk anormallikleri (kırmızı, siyah, yeşil = uyarı)
                        - Kıvam (çok sulu veya çok sert = dikkat)
                        - Parazit, mukus veya yabancı cisim belirtileri
                        - Normal ise bunu belirt ve "uyariMi": false yap
                        """
                    ]
                ]
            ]
        ]

        let yanit = try await istekGonder(mesajlar: mesajlar)
        return try yanitParsele(yanit, tur: DiskiAnalizi.self)
    }

    // MARK: - HTTP

    private func istekGonder(mesajlar: [[String: Any]]) async throws -> [String: Any] {
        guard let apiKey = AnahtarlikServisi.getir() else {
            throw ClaudeAPIHatasi.apiAnahtariYok
        }

        guard let url = URL(string: baseURL) else {
            throw ClaudeAPIHatasi.agHatasi("Geçersiz URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue(apiVersion, forHTTPHeaderField: "anthropic-version")

        let body: [String: Any] = [
            "model": model,
            "max_tokens": 1024,
            "messages": mesajlar
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        request.timeoutInterval = 60

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw ClaudeAPIHatasi.agHatasi("HTTP yanıtı alınamadı")
        }

        guard httpResponse.statusCode == 200 else {
            let hataMetni = String(data: data, encoding: .utf8) ?? "Bilinmeyen hata"
            throw ClaudeAPIHatasi.gecersizYanit("HTTP \(httpResponse.statusCode): \(hataMetni)")
        }

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw ClaudeAPIHatasi.parseHatasi
        }

        return json
    }

    // MARK: - Parse

    private func yanitParsele<T: Codable>(_ json: [String: Any], tur: T.Type) throws -> T {
        guard let content = json["content"] as? [[String: Any]],
              let ilkBlok = content.first,
              let text = ilkBlok["text"] as? String else {
            throw ClaudeAPIHatasi.parseHatasi
        }

        // JSON blogu bul (``` arasinda olabilir)
        let temizMetin = jsonCikar(text)

        guard let jsonData = temizMetin.data(using: .utf8) else {
            throw ClaudeAPIHatasi.parseHatasi
        }

        do {
            return try JSONDecoder().decode(T.self, from: jsonData)
        } catch {
            throw ClaudeAPIHatasi.parseHatasi
        }
    }

    private func jsonCikar(_ metin: String) -> String {
        var temiz = metin.trimmingCharacters(in: .whitespacesAndNewlines)

        // ```json ... ``` blogu varsa cikar
        if let jsonBaslangic = temiz.range(of: "```json") {
            temiz = String(temiz[jsonBaslangic.upperBound...])
            if let jsonBitis = temiz.range(of: "```") {
                temiz = String(temiz[..<jsonBitis.lowerBound])
            }
        } else if let jsonBaslangic = temiz.range(of: "```") {
            temiz = String(temiz[jsonBaslangic.upperBound...])
            if let jsonBitis = temiz.range(of: "```") {
                temiz = String(temiz[..<jsonBitis.lowerBound])
            }
        }

        // { ile baslamiyor ama icinde { varsa kes
        if !temiz.hasPrefix("{"), let braceIdx = temiz.firstIndex(of: "{") {
            temiz = String(temiz[braceIdx...])
        }

        return temiz.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func gorselTuruTespit(_ data: Data) -> String {
        guard data.count > 4 else { return "image/jpeg" }
        let bytes = [UInt8](data.prefix(4))

        if bytes[0] == 0x89, bytes[1] == 0x50 {
            return "image/png"
        } else if bytes[0] == 0x47, bytes[1] == 0x49 {
            return "image/gif"
        } else if bytes[0] == 0x52, bytes[1] == 0x49 {
            return "image/webp"
        }
        return "image/jpeg"
    }
}
