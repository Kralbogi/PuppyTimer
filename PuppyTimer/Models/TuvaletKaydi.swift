import Foundation
import SwiftData

enum TuvaletTuru: String, Codable, CaseIterable {
    case buyuk = "Buyuk Tuvalet"
    case kucuk = "Kucuk Tuvalet"

    var baslik: String {
        switch self {
        case .buyuk: return "Büyük Tuvalet"
        case .kucuk: return "Küçük Tuvalet"
        }
    }
}

enum DiskilamaSekli: String, Codable, CaseIterable {
    case yuvarlakKucuk = "Yuvarlak Kucuk"
    case normal = "Normal"
    case sulu = "Sulu"
    case sert = "Sert"

    var baslik: String {
        switch self {
        case .yuvarlakKucuk: return "Yuvarlak Küçük"
        case .normal: return "Normal"
        case .sulu: return "Sulu"
        case .sert: return "Sert"
        }
    }

    var ikon: String {
        switch self {
        case .yuvarlakKucuk: return "circle.grid.2x2"
        case .normal: return "checkmark.circle"
        case .sulu: return "drop.triangle"
        case .sert: return "square.fill"
        }
    }
}

enum DiskilamaMiktar: String, Codable, CaseIterable {
    case az = "Az"
    case normal = "Normal"
    case cok = "Cok"

    var baslik: String {
        switch self {
        case .az: return "Az"
        case .normal: return "Normal"
        case .cok: return "Çok"
        }
    }
}

enum DiskiRenk: String, Codable, CaseIterable {
    case kahverengi = "Kahverengi"
    case koyu = "Koyu"
    case acik = "Acik"
    case yesil = "Yesil"
    case kirmizi = "Kirmizi"
    case siyah = "Siyah"

    var baslik: String {
        switch self {
        case .kahverengi: return "Kahverengi"
        case .koyu: return "Koyu"
        case .acik: return "Açık"
        case .yesil: return "Yeşil"
        case .kirmizi: return "Kırmızı"
        case .siyah: return "Siyah"
        }
    }

    var uyariMi: Bool {
        self == .kirmizi || self == .siyah
    }

    var renk: String {
        switch self {
        case .kahverengi: return "brown"
        case .koyu: return "gray"
        case .acik: return "orange"
        case .yesil: return "green"
        case .kirmizi: return "red"
        case .siyah: return "black"
        }
    }
}

enum DiskiKivam: String, Codable, CaseIterable {
    case sert = "Sert"
    case normal = "Normal"
    case yumusak = "Yumusak"
    case sulu = "Sulu"

    var baslik: String {
        switch self {
        case .sert: return "Sert"
        case .normal: return "Normal"
        case .yumusak: return "Yumuşak"
        case .sulu: return "Sulu"
        }
    }
}

enum IdrarRenk: String, Codable, CaseIterable {
    case normal = "Normal"
    case koyu = "Koyu"
    case acik = "Acik"
    case kirmizi = "Kirmizi"

    var baslik: String {
        switch self {
        case .normal: return "Normal"
        case .koyu: return "Koyu"
        case .acik: return "Açık"
        case .kirmizi: return "Kırmızı"
        }
    }

    var uyariMi: Bool {
        self == .kirmizi
    }
}

@Model
final class TuvaletKaydi {
    var tarih: Date
    var tur: TuvaletTuru

    // Buyuk tuvalet
    var sekil: DiskilamaSekli?
    var miktar: DiskilamaMiktar?
    var diskiRenk: DiskiRenk?
    var kivam: DiskiKivam?

    // Kucuk tuvalet
    var idrarRenk: IdrarRenk?
    var idrarMiktar: DiskilamaMiktar?

    // Ortak
    var not: String?
    var fotoData: Data?
    var enlem: Double?
    var boylam: Double?

    // AI analiz
    var yapayZekaAnalizi: String?
    var uyariVar: Bool

    var kopek: Kopek?

    init(tur: TuvaletTuru, kopek: Kopek) {
        self.tarih = Date()
        self.tur = tur
        self.uyariVar = false
        self.kopek = kopek
    }
}
