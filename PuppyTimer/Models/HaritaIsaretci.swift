import Foundation
import SwiftData

enum IsaretciTuru: String, Codable, CaseIterable {
    case yuruyus = "Yuruyus"
    case buyukTuvalet = "Buyuk Tuvalet"
    case kucukTuvalet = "Kucuk Tuvalet"
    case favori = "Favori Yer"
    case diger = "Diger"

    var baslik: String {
        switch self {
        case .yuruyus: return "Yürüyüş"
        case .buyukTuvalet: return "Büyük Tuvalet"
        case .kucukTuvalet: return "Küçük Tuvalet"
        case .favori: return "Favori Yer"
        case .diger: return "Diğer"
        }
    }

    var ikon: String {
        switch self {
        case .yuruyus: return "figure.walk"
        case .buyukTuvalet: return "leaf.fill"
        case .kucukTuvalet: return "drop.fill"
        case .favori: return "star.fill"
        case .diger: return "mappin"
        }
    }

    var renk: String {
        switch self {
        case .yuruyus: return "green"
        case .buyukTuvalet: return "brown"
        case .kucukTuvalet: return "yellow"
        case .favori: return "orange"
        case .diger: return "gray"
        }
    }
}

@Model
final class HaritaIsaretci {
    var baslik: String
    var not: String?
    var enlem: Double
    var boylam: Double
    var tur: IsaretciTuru
    var tarih: Date

    var kopek: Kopek?

    init(baslik: String, enlem: Double, boylam: Double, tur: IsaretciTuru, kopek: Kopek) {
        self.baslik = baslik
        self.enlem = enlem
        self.boylam = boylam
        self.tur = tur
        self.tarih = Date()
        self.kopek = kopek
    }
}
