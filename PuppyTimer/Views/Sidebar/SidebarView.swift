import SwiftUI
import SwiftData

struct SidebarView: View {
    @Binding var secilenKopek: Kopek?
    @Binding var secilenBolum: NavigasyonBolumu?
    @Query(sort: \Kopek.ad) private var kopekler: [Kopek]
    @Environment(\.modelContext) private var modelContext
    @State private var kopekEkleGoster = false
    @StateObject private var premiumServisi = PremiumServisi.shared

    // Köpek bazlı bölümler
    private let kopekBolumleri: [NavigasyonBolumu] = [
        .profil, .zamanlayicilar, .yuruyusler, .tuvalet, .harita, .saglik
    ]

    // Global bölümler
    private let globalBolumler: [NavigasyonBolumu] = [
        .topluluk, .magaza, .premium
    ]

    var body: some View {
        List(selection: $secilenBolum) {
            // ── Köpeklerim ──────────────────────────────────────────────
            Section("Köpeklerim") {
                ForEach(kopekler) { kopek in
                    HStack {
                        KopekAvatarView(kopek: kopek, boyut: 32)
                        Text(kopek.ad)
                            .fontWeight(secilenKopek?.id == kopek.id ? .bold : .regular)
                    }
                    .tag(NavigasyonBolumu.profil)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        secilenKopek = kopek
                        secilenBolum = .profil
                    }
                    .contextMenu {
                        Button("Sil", role: .destructive) { kopekSil(kopek) }
                    }
                }

                Button {
                    kopekEkleGoster = true
                } label: {
                    Label("Köpek Ekle", systemImage: "plus.circle")
                }
                .buttonStyle(.plain)
                .foregroundStyle(.blue)
            }

            // ── Köpek bölümleri ─────────────────────────────────────────
            if secilenKopek != nil {
                Section("Bölümler") {
                    ForEach(kopekBolumleri) { bolum in
                        Label(bolum.rawValue, systemImage: bolum.ikon)
                            .tag(bolum)
                    }
                }
            }

            // ── Keşfet (global) ─────────────────────────────────────────
            Section("Keşfet") {
                ForEach(globalBolumler) { bolum in
                    HStack {
                        Label(bolum.rawValue, systemImage: bolum.ikon)
                        if bolum == .premium && premiumServisi.isPremium {
                            Spacer()
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(.orange)
                                .font(.caption)
                        }
                    }
                    .tag(bolum)
                }
            }
        }
        .listStyle(.sidebar)
        .navigationTitle("PawLand")
        .sheet(isPresented: $kopekEkleGoster) {
            KopekEkleView { yeniKopek in
                secilenKopek = yeniKopek
                secilenBolum = .profil
            }
        }
        .onAppear {
            if secilenKopek == nil, let ilk = kopekler.first {
                secilenKopek = ilk
            }
            premiumServisi.premiumDinle()
        }
    }

    private func kopekSil(_ kopek: Kopek) {
        if secilenKopek?.id == kopek.id { secilenKopek = nil }
        modelContext.delete(kopek)
        try? modelContext.save()
    }
}
