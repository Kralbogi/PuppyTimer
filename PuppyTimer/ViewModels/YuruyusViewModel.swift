import Foundation
import SwiftData

@Observable
final class YuruyusViewModel {
    var programlar: [YuruyusProgrami] = []
    var kayitlar: [YuruyusKaydi] = []
    var bugunYuruyusler: [YuruyusKaydi] = []

    private var modelContext: ModelContext
    private var kopek: Kopek

    init(modelContext: ModelContext, kopek: Kopek) {
        self.modelContext = modelContext
        self.kopek = kopek
        verileriGetir()
    }

    func verileriGetir() {
        programlar = kopek.yuruyusProgramlari.sorted { $0.baslik < $1.baslik }
        kayitlar = kopek.yuruyusKayitlari.sorted { $0.baslamaTarihi > $1.baslamaTarihi }
        bugunYuruyusler = kayitlar.filter { $0.baslamaTarihi.bugunMu }
    }

    // MARK: - Program Islemleri

    func programEkle(baslik: String, saat: Date, gunler: [Int], sure: Int) {
        let program = YuruyusProgrami(
            baslik: baslik, saat: saat, gunler: gunler, sure: sure, kopek: kopek
        )
        modelContext.insert(program)
        try? modelContext.save()

        // Bildirim planla
        bildirimiPlanla(program: program)
        verileriGetir()
    }

    func programSil(_ program: YuruyusProgrami) {
        modelContext.delete(program)
        try? modelContext.save()
        verileriGetir()
    }

    func programToggle(_ program: YuruyusProgrami) {
        program.aktif.toggle()
        try? modelContext.save()
        verileriGetir()
    }

    // MARK: - Yuruyus Kayit

    func yuruyusuBaslat() -> YuruyusKaydi {
        let kayit = YuruyusKaydi(kopek: kopek)
        modelContext.insert(kayit)
        try? modelContext.save()
        verileriGetir()
        return kayit
    }

    func yuruyusuBitir(_ kayit: YuruyusKaydi) {
        kayit.bitisTarihi = Date()
        kayit.tamamlandi = true

        let sure = kayit.bitisTarihi!.timeIntervalSince(kayit.baslamaTarihi)
        kayit.sure = Int(sure / 60)

        try? modelContext.save()
        verileriGetir()
    }

    func yuruyusTamamla(_ kayit: YuruyusKaydi) {
        kayit.tamamlandi = true
        if kayit.bitisTarihi == nil {
            kayit.bitisTarihi = Date()
            let sure = kayit.bitisTarihi!.timeIntervalSince(kayit.baslamaTarihi)
            kayit.sure = Int(sure / 60)
        }
        try? modelContext.save()
        verileriGetir()
    }

    func kayitSil(_ kayit: YuruyusKaydi) {
        modelContext.delete(kayit)
        try? modelContext.save()
        verileriGetir()
    }

    // MARK: - Bildirim

    private func bildirimiPlanla(program: YuruyusProgrami) {
        let takvim = Calendar.current
        let saatBileseni = takvim.dateComponents([.hour, .minute], from: program.saat)

        guard let saat = saatBileseni.hour, let dakika = saatBileseni.minute else { return }

        let simdi = Date()
        var hedefTarih = takvim.date(
            bySettingHour: saat, minute: dakika, second: 0, of: simdi
        ) ?? simdi

        if hedefTarih <= simdi {
            hedefTarih = takvim.date(byAdding: .day, value: 1, to: hedefTarih) ?? hedefTarih
        }

        let kalan = hedefTarih.timeIntervalSince(simdi)

        BildirimYoneticisi.shared.zamanlayiciBildirimiPlanla(
            kopekAdi: kopek.ad,
            tur: .yuruyus,
            sure: kalan,
            programID: program.persistentModelID.hashValue.description
        )
    }
}
