import SwiftUI
import SwiftData

struct SaglikDashboardView: View {
    let kopek: Kopek
    @Environment(\.modelContext) private var modelContext
    @State private var viewModel: SaglikViewModel?
    @State private var secilenTab = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Baslik
            VStack(alignment: .leading, spacing: 4) {
                Text("Sağlık Kayıtları")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                Text("\(kopek.ad) için sağlık bilgileri")
                    .foregroundStyle(.secondary)
            }
            .padding(24)

            // Tab secimi
            Picker("Bölüm", selection: $secilenTab) {
                Text("Genel Bakış").tag(0)
                Text("Aşılar").tag(1)
                Text("Veteriner").tag(2)
                Text("İlaçlar").tag(3)
                Text("Notlar").tag(4)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 24)

            Divider()
                .padding(.top, 12)

            // Icerik
            ScrollView {
                Group {
                    if let vm = viewModel {
                        switch secilenTab {
                        case 0: genelBakis(vm: vm)
                        case 1: AsiListView(viewModel: vm)
                        case 2: VeterinerZiyaretiView(viewModel: vm)
                        case 3: IlacTakibiView(viewModel: vm)
                        case 4: SaglikNotuView(viewModel: vm)
                        default: genelBakis(vm: vm)
                        }
                    }
                }
                .padding(24)
            }
        }
        .navigationTitle("Sağlık - \(kopek.ad)")
        .onAppear {
            viewModel = SaglikViewModel(modelContext: modelContext, kopek: kopek)
        }
    }

    // MARK: - Genel Bakis

    @ViewBuilder
    private func genelBakis(vm: SaglikViewModel) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            // Yaklasan Asilar
            if !vm.yaklasanAsilar.isEmpty {
                ozetBolum(baslik: "Yaklaşan Aşılar", ikon: "syringe", renk: .red) {
                    ForEach(vm.yaklasanAsilar) { asi in
                        HStack {
                            Text(asi.asiAdi)
                                .fontWeight(.medium)
                            Spacer()
                            if let sonraki = asi.sonrakiTarih {
                                Text(sonraki.turkceTarih)
                                    .font(.caption)
                                    .foregroundStyle(.red)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
            }

            // Aktif Ilaclar
            if !vm.aktifIlaclar.isEmpty {
                ozetBolum(baslik: "Aktif İlaçlar", ikon: "pill", renk: .blue) {
                    ForEach(vm.aktifIlaclar) { ilac in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(ilac.ilacAdi)
                                    .fontWeight(.medium)
                                Text(ilac.doz)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            if let sonraki = ilac.birSonrakiDoz {
                                Text("Sonraki: \(sonraki.turkceSaat)")
                                    .font(.caption)
                                    .foregroundStyle(.blue)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
            }

            // Son Veteriner Ziyareti
            if let sonZiyaret = vm.ziyaretler.first {
                ozetBolum(baslik: "Son Veteriner Ziyareti", ikon: "stethoscope", renk: .green) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(sonZiyaret.neden)
                            .fontWeight(.medium)
                        Text(sonZiyaret.tarih.turkceTarih)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        if let teshis = sonZiyaret.teshis {
                            Text("Teşhis: \(teshis)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }

            // Istatistikler
            ozetBolum(baslik: "İstatistikler", ikon: "chart.bar", renk: .purple) {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    istatistikKutu(baslik: "Toplam Aşı", sayi: vm.asilar.count, renk: .red)
                    istatistikKutu(baslik: "Vet. Ziyareti", sayi: vm.ziyaretler.count, renk: .green)
                    istatistikKutu(baslik: "Aktif İlaç", sayi: vm.aktifIlaclar.count, renk: .blue)
                    istatistikKutu(baslik: "Sağlık Notu", sayi: vm.notlar.count, renk: .orange)
                }
            }
        }
    }

    private func ozetBolum<Content: View>(
        baslik: String, ikon: String, renk: Color,
        @ViewBuilder icerik: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: ikon)
                    .foregroundStyle(renk)
                Text(baslik)
                    .font(.title3)
                    .fontWeight(.bold)
            }
            icerik()
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(renk.opacity(0.05))
        )
    }

    private func istatistikKutu(baslik: String, sayi: Int, renk: Color) -> some View {
        VStack {
            Text("\(sayi)")
                .font(.title)
                .fontWeight(.bold)
                .foregroundStyle(renk)
            Text(baslik)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(.background)
        )
    }
}
