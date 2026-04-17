import Foundation
import SwiftData

@Model
final class BeslenmeProgrami {
    var baslik: String
    var saatAraligi: Int
    var sonBeslenme: Date?
    var birSonrakiBeslenme: Date?
    var aktif: Bool
    var mamaMarkasi: String?
    var miktar: String?

    var kopek: Kopek?

    init(baslik: String, saatAraligi: Int, kopek: Kopek) {
        self.baslik = baslik
        self.saatAraligi = saatAraligi
        self.aktif = true
        self.kopek = kopek
    }
}
