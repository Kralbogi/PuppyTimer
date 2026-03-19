import Foundation
import SwiftData

@Observable
final class KopekListViewModel {
    var kopekler: [Kopek] = []

    private var modelContext: ModelContext

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
        kopekleriGetir()
    }

    func kopekleriGetir() {
        let descriptor = FetchDescriptor<Kopek>(sortBy: [SortDescriptor(\.ad)])
        kopekler = (try? modelContext.fetch(descriptor)) ?? []
    }

    func kopekEkle(ad: String, irk: String, cinsiyet: Cinsiyet) -> Kopek {
        let yeniKopek = Kopek(ad: ad, irk: irk, cinsiyet: cinsiyet)
        modelContext.insert(yeniKopek)
        try? modelContext.save()
        kopekleriGetir()
        return yeniKopek
    }

    func kopekSil(_ kopek: Kopek) {
        modelContext.delete(kopek)
        try? modelContext.save()
        kopekleriGetir()
    }
}
