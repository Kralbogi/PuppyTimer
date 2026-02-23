import Foundation
import SwiftData
import SwiftUI

@Observable
final class ZamanlayiciViewModel {
    var beslenmeProgramlari: [BeslenmeProgrami] = []
    var suProgramlari: [SuProgrami] = []
    var beslenmeKayitlari: [BeslenmeKaydi] = []

    private var modelContext: ModelContext
    private var kopek: Kopek
    private let zamanlayici = ZamanlayiciServisi.shared

    var kalanSureler: [String: TimeInterval] {
        zamanlayici.kalanSureler
    }

    init(modelContext: ModelContext, kopek: Kopek) {
        self.modelContext = modelContext
        self.kopek = kopek
        verileriGetir()
        zamanlayicilariKaydet()
    }

    // MARK: - Veri Islemleri

    func verileriGetir() {
        beslenmeProgramlari = kopek.beslenmeProgramlari.sorted { ($0.baslik) < ($1.baslik) }
        suProgramlari = kopek.suProgramlari
        beslenmeKayitlari = kopek.beslenmeKayitlari.sorted { $0.tarih > $1.tarih }
    }

    // MARK: - Mama Islemleri

    func beslenmeProgramiEkle(baslik: String, saatAraligi: Int, mamaMarkasi: String?, miktar: String?) {
        let program = BeslenmeProgrami(baslik: baslik, saatAraligi: saatAraligi, kopek: kopek)
        program.mamaMarkasi = mamaMarkasi
        program.miktar = miktar
        modelContext.insert(program)
        try? modelContext.save()
        verileriGetir()
    }

    func mamaVerildi(program: BeslenmeProgrami) {
        let kayit = BeslenmeKaydi(tur: .mama, kopek: kopek)
        kayit.miktar = program.miktar
        modelContext.insert(kayit)

        program.sonBeslenme = Date()
        let hedef = Date().addingTimeInterval(TimeInterval(program.saatAraligi * 3600))
        program.birSonrakiBeslenme = hedef

        try? modelContext.save()

        let programID = program.persistentModelID.hashValue.description
        zamanlayici.programKaydet(id: "mama_\(programID)", hedefTarih: hedef)

        BildirimYoneticisi.shared.zamanlayiciBildirimiPlanla(
            kopekAdi: kopek.ad,
            tur: .mama,
            sure: TimeInterval(program.saatAraligi * 3600),
            programID: programID
        )

        verileriGetir()
    }

    func beslenmeProgramiSil(_ program: BeslenmeProgrami) {
        let programID = program.persistentModelID.hashValue.description
        zamanlayici.programSil(id: "mama_\(programID)")
        BildirimYoneticisi.shared.bildirimiIptalEt(tur: .mama, programID: programID)
        modelContext.delete(program)
        try? modelContext.save()
        verileriGetir()
    }

    // MARK: - Su Islemleri

    func suProgramiEkle(saatAraligi: Int) {
        let program = SuProgrami(saatAraligi: saatAraligi, kopek: kopek)
        modelContext.insert(program)
        try? modelContext.save()
        verileriGetir()
    }

    func suVerildi(program: SuProgrami) {
        let kayit = SuKaydi(kopek: kopek)
        modelContext.insert(kayit)

        program.sonSuVerme = Date()
        let hedef = Date().addingTimeInterval(TimeInterval(program.saatAraligi * 3600))
        program.birSonrakiSuVerme = hedef

        try? modelContext.save()

        let programID = program.persistentModelID.hashValue.description
        zamanlayici.programKaydet(id: "su_\(programID)", hedefTarih: hedef)

        BildirimYoneticisi.shared.zamanlayiciBildirimiPlanla(
            kopekAdi: kopek.ad,
            tur: .su,
            sure: TimeInterval(program.saatAraligi * 3600),
            programID: programID
        )

        verileriGetir()
    }

    func suProgramiSil(_ program: SuProgrami) {
        let programID = program.persistentModelID.hashValue.description
        zamanlayici.programSil(id: "su_\(programID)")
        BildirimYoneticisi.shared.bildirimiIptalEt(tur: .su, programID: programID)
        modelContext.delete(program)
        try? modelContext.save()
        verileriGetir()
    }

    // MARK: - Zamanlayici Kayit

    private func zamanlayicilariKaydet() {
        for program in beslenmeProgramlari where program.aktif {
            if let hedef = program.birSonrakiBeslenme {
                let programID = program.persistentModelID.hashValue.description
                zamanlayici.programKaydet(id: "mama_\(programID)", hedefTarih: hedef)
            }
        }

        for program in suProgramlari where program.aktif {
            if let hedef = program.birSonrakiSuVerme {
                let programID = program.persistentModelID.hashValue.description
                zamanlayici.programKaydet(id: "su_\(programID)", hedefTarih: hedef)
            }
        }
    }

    func programIDGetir(_ program: BeslenmeProgrami) -> String {
        "mama_\(program.persistentModelID.hashValue.description)"
    }

    func suProgramIDGetir(_ program: SuProgrami) -> String {
        "su_\(program.persistentModelID.hashValue.description)"
    }
}
