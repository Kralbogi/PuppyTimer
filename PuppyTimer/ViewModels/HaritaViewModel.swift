import Foundation
import SwiftData
import MapKit

@Observable
final class HaritaViewModel {
    var isaretciler: [HaritaIsaretci] = []
    var filtrelenmisIsaretciler: [HaritaIsaretci] = []
    var secilenFiltreler: Set<IsaretciTuru> = Set(IsaretciTuru.allCases)
    var secilenIsaretci: HaritaIsaretci?

    private var modelContext: ModelContext
    private var kopek: Kopek

    init(modelContext: ModelContext, kopek: Kopek) {
        self.modelContext = modelContext
        self.kopek = kopek
        verileriGetir()
    }

    func verileriGetir() {
        isaretciler = kopek.haritaIsaretcileri.sorted { $0.tarih > $1.tarih }
        filtreUygula()
    }

    func filtreUygula() {
        filtrelenmisIsaretciler = isaretciler.filter { secilenFiltreler.contains($0.tur) }
    }

    func filtreToggle(_ tur: IsaretciTuru) {
        if secilenFiltreler.contains(tur) {
            secilenFiltreler.remove(tur)
        } else {
            secilenFiltreler.insert(tur)
        }
        filtreUygula()
    }

    func isaretciEkle(baslik: String, enlem: Double, boylam: Double, tur: IsaretciTuru, not: String?, tuvaletKaydiOlustur: Bool = true) {
        let isaretci = HaritaIsaretci(baslik: baslik, enlem: enlem, boylam: boylam, tur: tur, kopek: kopek)
        isaretci.not = not
        modelContext.insert(isaretci)

        if tuvaletKaydiOlustur && (tur == .buyukTuvalet || tur == .kucukTuvalet) {
            isaretcidenTuvaletOlustur(tur: tur, enlem: enlem, boylam: boylam, not: not)
        }

        try? modelContext.save()
        verileriGetir()
    }

    private func isaretcidenTuvaletOlustur(tur: IsaretciTuru, enlem: Double, boylam: Double, not: String?) {
        let tuvaletTuru: TuvaletTuru = tur == .buyukTuvalet ? .buyuk : .kucuk
        let kayit = TuvaletKaydi(tur: tuvaletTuru, kopek: kopek)
        kayit.enlem = enlem
        kayit.boylam = boylam
        kayit.not = not
        if tuvaletTuru == .buyuk {
            kayit.miktar = .normal
            kayit.kivam = .normal
            kayit.diskiRenk = .kahverengi
        } else {
            kayit.idrarMiktar = .normal
            kayit.idrarRenk = .normal
        }
        modelContext.insert(kayit)
    }

    func isaretciSil(_ isaretci: HaritaIsaretci) {
        modelContext.delete(isaretci)
        try? modelContext.save()
        verileriGetir()
    }

    func tuvalettenIsaretciOlustur(_ kayit: TuvaletKaydi) {
        guard let enlem = kayit.enlem, let boylam = kayit.boylam else { return }

        let tur: IsaretciTuru = kayit.tur == .buyuk ? .buyukTuvalet : .kucukTuvalet
        let baslik = "\(kayit.tur.baslik) - \(kayit.tarih.turkceSaat)"

        isaretciEkle(baslik: baslik, enlem: enlem, boylam: boylam, tur: tur, not: nil, tuvaletKaydiOlustur: false)
    }

    var varsayilanBolge: MKCoordinateRegion {
        if let ilk = isaretciler.first {
            return MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: ilk.enlem, longitude: ilk.boylam),
                span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
            )
        }
        // Varsayilan: Istanbul
        return MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 41.0082, longitude: 28.9784),
            span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
        )
    }
}
