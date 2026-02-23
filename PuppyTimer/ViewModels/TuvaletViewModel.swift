import Foundation
import SwiftData

@Observable
final class TuvaletViewModel {
    var kayitlar: [TuvaletKaydi] = []
    var bugunKayitlar: [TuvaletKaydi] = []
    var yukleniyor = false
    var analizSonucu: DiskiAnalizi?
    var hata: String?

    private var modelContext: ModelContext
    private var kopek: Kopek

    init(modelContext: ModelContext, kopek: Kopek) {
        self.modelContext = modelContext
        self.kopek = kopek
        verileriGetir()
    }

    func verileriGetir() {
        kayitlar = kopek.tuvaletKayitlari.sorted { $0.tarih > $1.tarih }
        bugunKayitlar = kayitlar.filter { $0.tarih.bugunMu }
    }

    // MARK: - Buyuk Tuvalet

    func buyukTuvaletEkle(
        sekil: DiskilamaSekli,
        miktar: DiskilamaMiktar,
        renk: DiskiRenk,
        kivam: DiskiKivam,
        not: String?,
        fotoData: Data?,
        enlem: Double?,
        boylam: Double?
    ) -> TuvaletKaydi {
        let kayit = TuvaletKaydi(tur: .buyuk, kopek: kopek)
        kayit.sekil = sekil
        kayit.miktar = miktar
        kayit.diskiRenk = renk
        kayit.kivam = kivam
        kayit.not = not
        kayit.fotoData = fotoData
        kayit.enlem = enlem
        kayit.boylam = boylam
        kayit.uyariVar = renk.uyariMi

        modelContext.insert(kayit)
        try? modelContext.save()
        verileriGetir()
        return kayit
    }

    // MARK: - Kucuk Tuvalet

    func kucukTuvaletEkle(
        renk: IdrarRenk,
        miktar: DiskilamaMiktar,
        not: String?,
        enlem: Double?,
        boylam: Double?
    ) -> TuvaletKaydi {
        let kayit = TuvaletKaydi(tur: .kucuk, kopek: kopek)
        kayit.idrarRenk = renk
        kayit.idrarMiktar = miktar
        kayit.not = not
        kayit.enlem = enlem
        kayit.boylam = boylam
        kayit.uyariVar = renk.uyariMi

        modelContext.insert(kayit)
        try? modelContext.save()
        verileriGetir()
        return kayit
    }

    // MARK: - Silme

    func kayitSil(_ kayit: TuvaletKaydi) {
        modelContext.delete(kayit)
        try? modelContext.save()
        verileriGetir()
    }

    // MARK: - AI Analiz

    func yapayZekaAnaliziBaslat(_ kayit: TuvaletKaydi) async {
        guard let fotoData = kayit.fotoData else {
            hata = "Analiz icin fotograf gerekli."
            return
        }

        yukleniyor = true
        hata = nil
        analizSonucu = nil

        do {
            let sonuc = try await ClaudeAPIServisi.shared.diskiAnalizEt(fotoData: fotoData)
            kayit.yapayZekaAnalizi = sonuc.aciklama
            kayit.uyariVar = sonuc.uyariMi
            try? modelContext.save()
            analizSonucu = sonuc
        } catch {
            self.hata = error.localizedDescription
        }

        yukleniyor = false
    }

    // MARK: - Istatistikler

    var bugunBuyukSayisi: Int {
        bugunKayitlar.filter { $0.tur == .buyuk }.count
    }

    var bugunKucukSayisi: Int {
        bugunKayitlar.filter { $0.tur == .kucuk }.count
    }

    var sonUyarilar: [TuvaletKaydi] {
        kayitlar.filter(\.uyariVar).prefix(5).map { $0 }
    }

    var buyukTuvaletKayitlari: [TuvaletKaydi] {
        kayitlar.filter { $0.tur == .buyuk }
    }

    var kucukTuvaletKayitlari: [TuvaletKaydi] {
        kayitlar.filter { $0.tur == .kucuk }
    }
}
