import Foundation
import SwiftData

@Model
final class YuruyusProgrami {
    var baslik: String
    var saat: Date
    var gunler: [Int]
    var sure: Int
    var aktif: Bool

    var kopek: Kopek?

    init(baslik: String, saat: Date, gunler: [Int], sure: Int, kopek: Kopek) {
        self.baslik = baslik
        self.saat = saat
        self.gunler = gunler
        self.sure = sure
        self.aktif = true
        self.kopek = kopek
    }
}
