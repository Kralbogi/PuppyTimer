import Foundation
import SwiftData

@Model
final class SuProgrami {
    var saatAraligi: Int
    var sonSuVerme: Date?
    var birSonrakiSuVerme: Date?
    var aktif: Bool

    var kopek: Kopek?

    init(saatAraligi: Int, kopek: Kopek) {
        self.saatAraligi = saatAraligi
        self.aktif = true
        self.kopek = kopek
    }
}
