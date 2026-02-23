import Foundation
import SwiftData

enum BeslenmeTuru: String, Codable {
    case mama = "Mama"
    case su = "Su"
}

@Model
final class BeslenmeKaydi {
    var tarih: Date
    var tur: BeslenmeTuru
    var miktar: String?
    var not: String?

    var kopek: Kopek?

    init(tur: BeslenmeTuru, kopek: Kopek) {
        self.tarih = Date()
        self.tur = tur
        self.kopek = kopek
    }
}
