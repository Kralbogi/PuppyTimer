import Foundation
import SwiftData

@Model
final class SuKaydi {
    var tarih: Date
    var not: String?

    var kopek: Kopek?

    init(kopek: Kopek) {
        self.tarih = Date()
        self.kopek = kopek
    }
}
