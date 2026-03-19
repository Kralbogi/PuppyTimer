import SwiftUI
import SwiftData

enum NavigasyonBolumu: String, CaseIterable, Identifiable {
    // ── Köpek bazlı bölümler ──────────────────────────────────────────────
    case profil        = "Profil"
    case zamanlayicilar = "Zamanlayıcılar"
    case yuruyusler    = "Yürüyüşler"
    case tuvalet       = "Tuvalet"
    case harita        = "Yerel Harita"
    case saglik        = "Sağlık Kayıtları"
    // ── Global bölümler ───────────────────────────────────────────────────
    case topluluk      = "Topluluk"
    case magaza        = "Mağaza"
    case premium       = "Premium"

    var id: String { rawValue }

    var ikon: String {
        switch self {
        case .profil:         return "pawprint.fill"
        case .zamanlayicilar: return "timer"
        case .yuruyusler:     return "figure.walk"
        case .tuvalet:        return "leaf.fill"
        case .harita:         return "map"
        case .saglik:         return "heart.text.square"
        case .topluluk:       return "person.2.fill"
        case .magaza:         return "bag.fill"
        case .premium:        return "crown.fill"
        }
    }

    var kopekGereklimi: Bool {
        switch self {
        case .topluluk, .magaza, .premium: return false
        default: return true
        }
    }

    var grup: String {
        switch self {
        case .profil, .zamanlayicilar, .yuruyusler, .tuvalet, .harita, .saglik:
            return "Köpeğim"
        case .topluluk, .magaza, .premium:
            return "Keşfet"
        }
    }
}

struct ContentView: View {
    @Query(sort: \Kopek.ad) private var kopekler: [Kopek]
    @State private var secilenKopek: Kopek?
    @State private var secilenBolum: NavigasyonBolumu? = .profil
    @State private var onboardingGoster = false

    var body: some View {
        Group {
            if kopekler.isEmpty && !onboardingGoster {
                OnboardingContainerView {
                    onboardingGoster = false
                }
            } else {
                anaSayfa
            }
        }
        .onAppear {
            if kopekler.isEmpty {
                onboardingGoster = false
            }
            // Firebase anonim giriş başlat
            Task { await FirestoreServisi.shared.anonimGirisYap() }
        }
    }

    private var anaSayfa: some View {
        NavigationSplitView {
            SidebarView(
                secilenKopek: $secilenKopek,
                secilenBolum: $secilenBolum
            )
            .navigationSplitViewColumnWidth(min: 220, ideal: 250)
        } detail: {
            detayGorunumu
        }
    }

    @ViewBuilder
    private var detayGorunumu: some View {
        switch secilenBolum {
        // ── Global bölümler (köpek gerekmez) ─────────────────────────
        case .topluluk:
            ToplulukView()
        case .magaza:
            MagazaView()
        case .premium:
            PremiumView()

        // ── Köpek bölümleri ────────────────────────────────────────────
        default:
            if let kopek = secilenKopek {
                kopekDetay(kopek: kopek)
            } else {
                BosSayfaView()
            }
        }
    }

    @ViewBuilder
    private func kopekDetay(kopek: Kopek) -> some View {
        switch secilenBolum {
        case .zamanlayicilar: ZamanlayiciDashboardView(kopek: kopek)
        case .yuruyusler:     YuruyusPlanView(kopek: kopek)
        case .tuvalet:        TuvaletDashboardView(kopek: kopek)
        case .harita:         HaritaDashboardView(kopek: kopek)
        case .saglik:         SaglikDashboardView(kopek: kopek)
        default:              KopekDetailView(kopek: kopek)
        }
    }
}
