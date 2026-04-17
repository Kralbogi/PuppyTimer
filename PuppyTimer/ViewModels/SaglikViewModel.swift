import Foundation
import SwiftData

@Observable
final class SaglikViewModel {
    var asilar: [AsiKaydi] = []
    var ziyaretler: [VeterinerZiyareti] = []
    var ilaclar: [IlacTakibi] = []
    var notlar: [SaglikNotu] = []

    private var modelContext: ModelContext
    private var kopek: Kopek

    init(modelContext: ModelContext, kopek: Kopek) {
        self.modelContext = modelContext
        self.kopek = kopek
        verileriGetir()
    }

    func verileriGetir() {
        asilar = kopek.asiKayitlari.sorted { $0.tarih > $1.tarih }
        ziyaretler = kopek.veterinerZiyaretleri.sorted { $0.tarih > $1.tarih }
        ilaclar = kopek.ilaclar.sorted { $0.ilacAdi < $1.ilacAdi }
        notlar = kopek.saglikNotlari.sorted { $0.tarih > $1.tarih }
    }

    // MARK: - Asi

    func asiEkle(asiAdi: String, tarih: Date, sonrakiTarih: Date?, veterinerAdi: String?, not: String?) {
        let kayit = AsiKaydi(asiAdi: asiAdi, tarih: tarih, kopek: kopek)
        kayit.sonrakiTarih = sonrakiTarih
        kayit.veterinerAdi = veterinerAdi
        kayit.not = not
        modelContext.insert(kayit)
        try? modelContext.save()

        if let sonraki = sonrakiTarih {
            let kalan = sonraki.timeIntervalSince(Date())
            if kalan > 0 {
                BildirimYoneticisi.shared.zamanlayiciBildirimiPlanla(
                    kopekAdi: kopek.ad,
                    tur: .asi,
                    sure: kalan,
                    programID: kayit.persistentModelID.hashValue.description
                )
            }
        }

        verileriGetir()
    }

    func asiSil(_ kayit: AsiKaydi) {
        modelContext.delete(kayit)
        try? modelContext.save()
        verileriGetir()
    }

    // MARK: - Veteriner

    func ziyaretEkle(tarih: Date, neden: String, teshis: String?, tedavi: String?,
                     veterinerAdi: String?, maliyet: Double?, not: String?) {
        let kayit = VeterinerZiyareti(tarih: tarih, neden: neden, kopek: kopek)
        kayit.teshis = teshis
        kayit.tedavi = tedavi
        kayit.veterinerAdi = veterinerAdi
        kayit.maliyet = maliyet
        kayit.not = not
        modelContext.insert(kayit)
        try? modelContext.save()
        verileriGetir()
    }

    func ziyaretSil(_ kayit: VeterinerZiyareti) {
        modelContext.delete(kayit)
        try? modelContext.save()
        verileriGetir()
    }

    // MARK: - Ilac

    func ilacEkle(ilacAdi: String, doz: String, baslangicTarihi: Date,
                  bitisTarihi: Date?, saatAraligi: Int, not: String?) {
        let kayit = IlacTakibi(
            ilacAdi: ilacAdi, doz: doz, baslangicTarihi: baslangicTarihi,
            saatAraligi: saatAraligi, kopek: kopek
        )
        kayit.bitisTarihi = bitisTarihi
        kayit.not = not

        let hedef = Date().addingTimeInterval(TimeInterval(saatAraligi * 3600))
        kayit.birSonrakiDoz = hedef

        modelContext.insert(kayit)
        try? modelContext.save()

        BildirimYoneticisi.shared.zamanlayiciBildirimiPlanla(
            kopekAdi: kopek.ad,
            tur: .ilac,
            sure: TimeInterval(saatAraligi * 3600),
            programID: kayit.persistentModelID.hashValue.description
        )

        verileriGetir()
    }

    func ilacDozVerildi(_ kayit: IlacTakibi) {
        kayit.sonDoz = Date()
        let hedef = Date().addingTimeInterval(TimeInterval(kayit.saatAraligi * 3600))
        kayit.birSonrakiDoz = hedef
        try? modelContext.save()

        BildirimYoneticisi.shared.zamanlayiciBildirimiPlanla(
            kopekAdi: kopek.ad,
            tur: .ilac,
            sure: TimeInterval(kayit.saatAraligi * 3600),
            programID: kayit.persistentModelID.hashValue.description
        )

        verileriGetir()
    }

    func ilacSil(_ kayit: IlacTakibi) {
        BildirimYoneticisi.shared.bildirimiIptalEt(
            tur: .ilac,
            programID: kayit.persistentModelID.hashValue.description
        )
        modelContext.delete(kayit)
        try? modelContext.save()
        verileriGetir()
    }

    // MARK: - Not

    func notEkle(baslik: String, icerik: String, kategori: SaglikKategorisi) {
        let not = SaglikNotu(baslik: baslik, icerik: icerik, kategori: kategori, kopek: kopek)
        modelContext.insert(not)
        try? modelContext.save()
        verileriGetir()
    }

    func notSil(_ not: SaglikNotu) {
        modelContext.delete(not)
        try? modelContext.save()
        verileriGetir()
    }

    // MARK: - Yardimcilar

    var yaklasanAsilar: [AsiKaydi] {
        asilar.filter { asi in
            guard let sonraki = asi.sonrakiTarih else { return false }
            return sonraki > Date() && sonraki.timeIntervalSince(Date()) < 30 * 24 * 3600
        }
    }

    var aktifIlaclar: [IlacTakibi] {
        ilaclar.filter(\.aktif)
    }
}
