import Foundation
import SwiftData

@Model
final class YuruyusKaydi {
    var baslamaTarihi: Date
    var bitisTarihi: Date?
    var sure: Int?
    var tamamlandi: Bool
    var not: String?

    var kopek: Kopek?

    init(kopek: Kopek) {
        self.baslamaTarihi = Date()
        self.tamamlandi = false
        self.kopek = kopek
    }
}
