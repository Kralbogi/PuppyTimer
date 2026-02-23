import SwiftUI
import SwiftData

struct SidebarView: View {
    @Binding var secilenKopek: Kopek?
    @Binding var secilenBolum: NavigasyonBolumu?
    @Query(sort: \Kopek.ad) private var kopekler: [Kopek]
    @Environment(\.modelContext) private var modelContext
    @State private var kopekEkleGoster = false

    var body: some View {
        List(selection: $secilenBolum) {
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
                        Button("Sil", role: .destructive) {
                            kopekSil(kopek)
                        }
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

            if secilenKopek != nil {
                Section("Bölümler") {
                    ForEach(NavigasyonBolumu.allCases) { bolum in
                        Label(bolum.rawValue, systemImage: bolum.ikon)
                            .tag(bolum)
                    }
                }
            }
        }
        .listStyle(.sidebar)
        .navigationTitle("PuppyTimer")
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
        }
    }

    private func kopekSil(_ kopek: Kopek) {
        if secilenKopek?.id == kopek.id {
            secilenKopek = nil
        }
        modelContext.delete(kopek)
        try? modelContext.save()
    }
}
