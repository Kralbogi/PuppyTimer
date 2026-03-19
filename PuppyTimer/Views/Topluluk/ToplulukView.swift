// =============================================================================
// PawLand macOS — ToplulukView
// Tab-bazlı topluluk ana ekranı: Harita | Sohbet | Arkadaşlar
// =============================================================================

import SwiftUI

struct ToplulukView: View {
    @StateObject private var premiumServisi = PremiumServisi.shared
    @State private var seciliTab: ToplulukTab = .harita

    enum ToplulukTab: String, CaseIterable {
        case harita     = "Harita"
        case sohbet     = "Sohbet"
        case arkadaslar = "Arkadaşlar"

        var icon: String {
            switch self {
            case .harita:     return "map"
            case .sohbet:     return "bubble.left.and.bubble.right"
            case .arkadaslar: return "person.2"
            }
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            // ── Tab seçici ────────────────────────────────────────────────
            HStack(spacing: 0) {
                ForEach(ToplulukTab.allCases, id: \.self) { tab in
                    Button {
                        seciliTab = tab
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: tab.icon)
                            Text(tab.rawValue)
                        }
                        .font(.subheadline.weight(seciliTab == tab ? .semibold : .regular))
                        .foregroundStyle(seciliTab == tab ? .orange : .secondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            seciliTab == tab
                                ? Color.orange.opacity(0.12)
                                : Color.clear
                        )
                    }
                    .buttonStyle(.plain)

                    if tab != ToplulukTab.allCases.last {
                        Divider()
                    }
                }
            }
            .background(.regularMaterial)
            .overlay(alignment: .bottom) {
                Divider()
            }

            // ── Tab içerikleri ────────────────────────────────────────────
            switch seciliTab {
            case .harita:
                ToplulukHaritaView()
            case .sohbet:
                ToplulukSohbetView()
            case .arkadaslar:
                ToplulukArkadaslarView()
            }
        }
    }
}
