import SwiftUI
import SwiftData

struct ZamanlayiciDashboardView: View {
    let kopek: Kopek
    @Environment(\.modelContext) private var modelContext
    @State private var viewModel: ZamanlayiciViewModel?
    @State private var mamaProgramiGoster = false
    @State private var suProgramiGoster = false

    private let zamanlayici = ZamanlayiciServisi.shared

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                baslik

                if let vm = viewModel {
                    zamanlayiciGrid(vm: vm)
                    beslenmeGecmisi(vm: vm)
                }
            }
            .padding(24)
        }
        .navigationTitle("Zamanlayıcılar - \(kopek.ad)")
        .toolbar {
            ToolbarItemGroup {
                Button("Mama Programı", systemImage: "fork.knife") {
                    mamaProgramiGoster = true
                }
                Button("Su Programı", systemImage: "drop.fill") {
                    suProgramiGoster = true
                }
            }
        }
        .sheet(isPresented: $mamaProgramiGoster) {
            MamaZamanlayiciView { baslik, saat, marka, miktar in
                viewModel?.beslenmeProgramiEkle(
                    baslik: baslik,
                    saatAraligi: saat,
                    mamaMarkasi: marka,
                    miktar: miktar
                )
            }
        }
        .sheet(isPresented: $suProgramiGoster) {
            SuZamanlayiciView { saat in
                viewModel?.suProgramiEkle(saatAraligi: saat)
            }
        }
        .onAppear {
            viewModel = ZamanlayiciViewModel(modelContext: modelContext, kopek: kopek)
        }
    }

    // MARK: - Alt Gorunumler

    private var baslik: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Mama ve Su Zamanlayıcıları")
                .font(.largeTitle)
                .fontWeight(.bold)
            Text("Zamanlayıcıları ekleyin ve takip edin.")
                .foregroundStyle(.secondary)
        }
    }

    @ViewBuilder
    private func zamanlayiciGrid(vm: ZamanlayiciViewModel) -> some View {
        let mamaVar = !vm.beslenmeProgramlari.isEmpty
        let suVar = !vm.suProgramlari.isEmpty

        if !mamaVar && !suVar {
            ContentUnavailableView(
                "Henüz zamanlayıcı yok",
                systemImage: "timer",
                description: Text("Araç çubuğundan mama veya su programı ekleyin.")
            )
            .frame(height: 200)
        } else {
            LazyVGrid(columns: [
                GridItem(.flexible(), spacing: 16),
                GridItem(.flexible(), spacing: 16)
            ], spacing: 16) {
                ForEach(vm.beslenmeProgramlari) { program in
                    let pid = vm.programIDGetir(program)
                    ZamanlayiciKartView(
                        baslik: program.baslik,
                        kalanSure: zamanlayici.kalanSureler[pid] ?? 0,
                        toplamSure: TimeInterval(program.saatAraligi * 3600),
                        renk: .orange,
                        tamamlaAction: { vm.mamaVerildi(program: program) }
                    )
                    .contextMenu {
                        Button("Sil", role: .destructive) {
                            vm.beslenmeProgramiSil(program)
                        }
                    }
                }

                ForEach(vm.suProgramlari) { program in
                    let pid = vm.suProgramIDGetir(program)
                    ZamanlayiciKartView(
                        baslik: "Su",
                        kalanSure: zamanlayici.kalanSureler[pid] ?? 0,
                        toplamSure: TimeInterval(program.saatAraligi * 3600),
                        renk: .blue,
                        tamamlaAction: { vm.suVerildi(program: program) }
                    )
                    .contextMenu {
                        Button("Sil", role: .destructive) {
                            vm.suProgramiSil(program)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func beslenmeGecmisi(vm: ZamanlayiciViewModel) -> some View {
        if !vm.beslenmeKayitlari.isEmpty {
            BeslenmeGecmisiView(kayitlar: vm.beslenmeKayitlari)
        }
    }
}
