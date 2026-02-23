import SwiftUI
import SwiftData

enum NavigasyonBolumu: String, CaseIterable, Identifiable {
    case profil = "Profil"
    case zamanlayicilar = "Zamanlayıcılar"
    case yuruyusler = "Yürüyüşler"
    case tuvalet = "Tuvalet"
    case harita = "Harita"
    case saglik = "Sağlık Kayıtları"

    var id: String { rawValue }

    var ikon: String {
        switch self {
        case .profil: return "pawprint.fill"
        case .zamanlayicilar: return "timer"
        case .yuruyusler: return "figure.walk"
        case .tuvalet: return "leaf.fill"
        case .harita: return "map"
        case .saglik: return "heart.text.square"
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
                onboardingGoster = false // onboarding gosterilecek
            }
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
            if let kopek = secilenKopek {
                detayGorunumu(kopek: kopek)
            } else {
                BosSayfaView()
            }
        }
    }

    @ViewBuilder
    private func detayGorunumu(kopek: Kopek) -> some View {
        switch secilenBolum {
        case .zamanlayicilar:
            ZamanlayiciDashboardView(kopek: kopek)
        case .yuruyusler:
            YuruyusPlanView(kopek: kopek)
        case .tuvalet:
            TuvaletDashboardView(kopek: kopek)
        case .harita:
            HaritaDashboardView(kopek: kopek)
        case .saglik:
            SaglikDashboardView(kopek: kopek)
        case .profil, .none:
            KopekDetailView(kopek: kopek)
        }
    }
}
