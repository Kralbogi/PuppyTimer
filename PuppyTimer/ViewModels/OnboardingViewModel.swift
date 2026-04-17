import Foundation
import SwiftData
import SwiftUI

enum OnboardingAdim: Int, CaseIterable {
    case hosgeldin = 0
    case fotoSec = 1
    case avatarOlustur = 2
    case bilgiGir = 3
    case tamamlandi = 4
}

@Observable
final class OnboardingViewModel {
    var adim: OnboardingAdim = .hosgeldin
    var kopekFoto: Data?
    var avatarData: Data?
    var avatarStil: AvatarStil = .pop
    var kopekAnalizi: KopekAnalizi?

    var kopekAdi = ""
    var kopekIrk = ""
    var cinsiyet: Cinsiyet = .erkek
    var dogumTarihi = Date()
    var dogumTarihiVar = false
    var agirlikStr = ""

    var yukleniyor = false
    var hata: String?

    private var modelContext: ModelContext

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    // MARK: - Navigasyon

    func ileri() {
        guard let sonraki = OnboardingAdim(rawValue: adim.rawValue + 1) else { return }
        adim = sonraki
    }

    func geri() {
        guard let onceki = OnboardingAdim(rawValue: adim.rawValue - 1) else { return }
        adim = onceki
    }

    // MARK: - AI Analiz

    func fotoAnalizEt() async {
        guard let fotoData = kopekFoto else { return }
        yukleniyor = true
        hata = nil

        // Once avatar olustur (hizli, offline)
        avatarData = AvatarOlusturucu.olustur(fotoData: fotoData, stil: avatarStil)

        // Sonra AI analiz (API key varsa)
        if AnahtarlikServisi.anahtarVarMi {
            do {
                let analiz = try await ClaudeAPIServisi.shared.kopekFotoAnalizEt(fotoData: fotoData)
                kopekAnalizi = analiz
                kopekIrk = analiz.irk
            } catch {
                // AI analiz opsiyonel - hata olursa devam et
                self.hata = "AI analiz yapilamadi: \(error.localizedDescription)"
            }
        }

        yukleniyor = false
    }

    func avatarStilDegistir(_ stil: AvatarStil) {
        avatarStil = stil
        guard let fotoData = kopekFoto else { return }
        avatarData = AvatarOlusturucu.olustur(fotoData: fotoData, stil: stil)
    }

    // MARK: - Kaydet

    func kaydet() -> Kopek {
        let kopek = Kopek(
            ad: kopekAdi.trimmingCharacters(in: .whitespaces),
            irk: kopekIrk.trimmingCharacters(in: .whitespaces),
            cinsiyet: cinsiyet
        )

        kopek.fotoData = kopekFoto
        kopek.avatarData = avatarData

        if dogumTarihiVar {
            kopek.dogumTarihi = dogumTarihi
        }

        if let kg = Double(agirlikStr) {
            kopek.agirlik = kg
        }

        if let analiz = kopekAnalizi {
            kopek.irkTanimi = analiz.genel
            kopek.renkTanimi = analiz.renk
        }

        modelContext.insert(kopek)
        try? modelContext.save()
        return kopek
    }
}
