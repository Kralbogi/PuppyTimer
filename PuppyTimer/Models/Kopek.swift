import Foundation
import SwiftData

enum Cinsiyet: String, Codable, CaseIterable {
    case erkek = "Erkek"
    case disi = "Disi"

    var baslik: String {
        switch self {
        case .erkek: return "Erkek"
        case .disi: return "Dişi"
        }
    }
}

@Model
final class Kopek {
    var ad: String
    var irk: String
    var dogumTarihi: Date?
    var agirlik: Double?
    var cinsiyet: Cinsiyet
    var fotoData: Data?
    var avatarData: Data?
    var irkTanimi: String?
    var renkTanimi: String?
    var olusturmaTarihi: Date

    @Relationship(deleteRule: .cascade, inverse: \BeslenmeProgrami.kopek)
    var beslenmeProgramlari: [BeslenmeProgrami] = []

    @Relationship(deleteRule: .cascade, inverse: \SuProgrami.kopek)
    var suProgramlari: [SuProgrami] = []

    @Relationship(deleteRule: .cascade, inverse: \BeslenmeKaydi.kopek)
    var beslenmeKayitlari: [BeslenmeKaydi] = []

    @Relationship(deleteRule: .cascade, inverse: \SuKaydi.kopek)
    var suKayitlari: [SuKaydi] = []

    @Relationship(deleteRule: .cascade, inverse: \YuruyusProgrami.kopek)
    var yuruyusProgramlari: [YuruyusProgrami] = []

    @Relationship(deleteRule: .cascade, inverse: \YuruyusKaydi.kopek)
    var yuruyusKayitlari: [YuruyusKaydi] = []

    @Relationship(deleteRule: .cascade, inverse: \AsiKaydi.kopek)
    var asiKayitlari: [AsiKaydi] = []

    @Relationship(deleteRule: .cascade, inverse: \VeterinerZiyareti.kopek)
    var veterinerZiyaretleri: [VeterinerZiyareti] = []

    @Relationship(deleteRule: .cascade, inverse: \IlacTakibi.kopek)
    var ilaclar: [IlacTakibi] = []

    @Relationship(deleteRule: .cascade, inverse: \SaglikNotu.kopek)
    var saglikNotlari: [SaglikNotu] = []

    @Relationship(deleteRule: .cascade, inverse: \TuvaletKaydi.kopek)
    var tuvaletKayitlari: [TuvaletKaydi] = []

    @Relationship(deleteRule: .cascade, inverse: \HaritaIsaretci.kopek)
    var haritaIsaretcileri: [HaritaIsaretci] = []

    init(ad: String, irk: String, cinsiyet: Cinsiyet) {
        self.ad = ad
        self.irk = irk
        self.cinsiyet = cinsiyet
        self.olusturmaTarihi = Date()
    }
}
