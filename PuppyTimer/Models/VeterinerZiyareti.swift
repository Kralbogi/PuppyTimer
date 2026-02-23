import Foundation
import SwiftData

@Model
final class VeterinerZiyareti {
    var tarih: Date
    var neden: String
    var teshis: String?
    var tedavi: String?
    var veterinerAdi: String?
    var maliyet: Double?
    var not: String?

    var kopek: Kopek?

    init(tarih: Date, neden: String, kopek: Kopek) {
        self.tarih = tarih
        self.neden = neden
        self.kopek = kopek
    }
}
