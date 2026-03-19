import Foundation
import SwiftData

@Model
final class IlacTakibi {
    var ilacAdi: String
    var doz: String
    var baslangicTarihi: Date
    var bitisTarihi: Date?
    var saatAraligi: Int
    var sonDoz: Date?
    var birSonrakiDoz: Date?
    var aktif: Bool
    var not: String?

    var kopek: Kopek?

    init(ilacAdi: String, doz: String, baslangicTarihi: Date, saatAraligi: Int, kopek: Kopek) {
        self.ilacAdi = ilacAdi
        self.doz = doz
        self.baslangicTarihi = baslangicTarihi
        self.saatAraligi = saatAraligi
        self.aktif = true
        self.kopek = kopek
    }
}
