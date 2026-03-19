import Foundation
import SwiftData

@Model
final class AsiKaydi {
    var asiAdi: String
    var tarih: Date
    var sonrakiTarih: Date?
    var veterinerAdi: String?
    var not: String?

    var kopek: Kopek?

    init(asiAdi: String, tarih: Date, kopek: Kopek) {
        self.asiAdi = asiAdi
        self.tarih = tarih
        self.kopek = kopek
    }
}
