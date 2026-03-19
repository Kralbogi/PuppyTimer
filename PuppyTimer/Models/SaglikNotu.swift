import Foundation
import SwiftData

enum SaglikKategorisi: String, Codable, CaseIterable {
    case genel = "Genel"
    case allerji = "Alerji"
    case diyet = "Diyet"
    case davranis = "Davranis"
    case diger = "Diger"

    var baslik: String {
        switch self {
        case .genel: return "Genel"
        case .allerji: return "Alerji"
        case .diyet: return "Diyet"
        case .davranis: return "Davranış"
        case .diger: return "Diğer"
        }
    }
}

@Model
final class SaglikNotu {
    var baslik: String
    var icerik: String
    var tarih: Date
    var kategori: SaglikKategorisi

    var kopek: Kopek?

    init(baslik: String, icerik: String, kategori: SaglikKategorisi, kopek: Kopek) {
        self.baslik = baslik
        self.icerik = icerik
        self.tarih = Date()
        self.kategori = kategori
        self.kopek = kopek
    }
}
