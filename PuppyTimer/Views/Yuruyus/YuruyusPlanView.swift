import SwiftUI
import SwiftData

struct YuruyusPlanView: View {
    let kopek: Kopek
    @Environment(\.modelContext) private var modelContext
    @State private var viewModel: YuruyusViewModel?
    @State private var programEkleGoster = false
    @State private var aktifYuruyus: YuruyusKaydi?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                baslik
                hizliBaslat

                if let vm = viewModel {
                    bugunDurumu(vm: vm)
                    programListesi(vm: vm)
                    gecmis(vm: vm)
                }
            }
            .padding(24)
        }
        .navigationTitle("Yürüyüşler - \(kopek.ad)")
        .toolbar {
            ToolbarItem {
                Button("Program Ekle", systemImage: "plus") {
                    programEkleGoster = true
                }
            }
        }
        .sheet(isPresented: $programEkleGoster) {
            YuruyusKaydiView { baslik, saat, gunler, sure in
                viewModel?.programEkle(baslik: baslik, saat: saat, gunler: gunler, sure: sure)
            }
        }
        .onAppear {
            viewModel = YuruyusViewModel(modelContext: modelContext, kopek: kopek)
        }
    }

    // MARK: - Alt Gorunumler

    private var baslik: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Yürüyüş Takibi")
                .font(.largeTitle)
                .fontWeight(.bold)
            Text("Günlük yürüyüşleri planlayın ve takip edin.")
                .foregroundStyle(.secondary)
        }
    }

    private var hizliBaslat: some View {
        HStack(spacing: 16) {
            if let aktif = aktifYuruyus, !aktif.tamamlandi {
                VStack(alignment: .leading) {
                    Text("Yürüyüş devam ediyor...")
                        .fontWeight(.semibold)
                    Text("Başlama: \(aktif.baslamaTarihi.turkceSaat)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Button {
                    viewModel?.yuruyusuBitir(aktif)
                    aktifYuruyus = nil
                } label: {
                    Label("Bitir", systemImage: "stop.circle.fill")
                }
                .buttonStyle(.borderedProminent)
                .tint(.red)
            } else {
                Button {
                    aktifYuruyus = viewModel?.yuruyusuBaslat()
                } label: {
                    Label("Yürüyüşe Başla", systemImage: "figure.walk")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.green)
                .controlSize(.large)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.green.opacity(0.1))
        )
    }

    @ViewBuilder
    private func bugunDurumu(vm: YuruyusViewModel) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Bugünün Yürüyüşleri")
                .font(.title2)
                .fontWeight(.bold)

            if vm.bugunYuruyusler.isEmpty {
                Text("Bugün henüz yürüyüş yapılmadı.")
                    .foregroundStyle(.secondary)
                    .padding()
            } else {
                ForEach(vm.bugunYuruyusler) { kayit in
                    HStack {
                        Image(systemName: kayit.tamamlandi ? "checkmark.circle.fill" : "circle")
                            .foregroundStyle(kayit.tamamlandi ? .green : .secondary)

                        VStack(alignment: .leading) {
                            Text(kayit.baslamaTarihi.turkceSaat)
                                .fontWeight(.medium)
                            if let sure = kayit.sure {
                                Text("\(sure) dakika")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        Spacer()

                        if let not = kayit.not {
                            Text(not)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 6)
                    .padding(.horizontal, 12)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(.background)
                    )
                }
            }
        }
    }

    @ViewBuilder
    private func programListesi(vm: YuruyusViewModel) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Yürüyüş Programları")
                .font(.title2)
                .fontWeight(.bold)

            if vm.programlar.isEmpty {
                Text("Henüz yürüyüş programı eklenmemiş.")
                    .foregroundStyle(.secondary)
                    .padding()
            } else {
                ForEach(vm.programlar) { program in
                    HStack {
                        Toggle("", isOn: Binding(
                            get: { program.aktif },
                            set: { _ in vm.programToggle(program) }
                        ))
                        .labelsHidden()

                        VStack(alignment: .leading) {
                            Text(program.baslik)
                                .fontWeight(.medium)
                            Text("\(program.sure) dk - \(program.saat.turkceSaat)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()

                        HStack(spacing: 4) {
                            ForEach(gunIsimleri(program.gunler), id: \.self) { gun in
                                Text(gun)
                                    .font(.caption2)
                                    .padding(.horizontal, 4)
                                    .padding(.vertical, 2)
                                    .background(Capsule().fill(.green.opacity(0.2)))
                            }
                        }

                        Button(role: .destructive) {
                            vm.programSil(program)
                        } label: {
                            Image(systemName: "trash")
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(.red)
                    }
                    .padding(.vertical, 8)
                    .padding(.horizontal, 12)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(program.aktif ? Color(.controlBackgroundColor) : Color.secondary.opacity(0.1))
                    )
                }
            }
        }
    }

    @ViewBuilder
    private func gecmis(vm: YuruyusViewModel) -> some View {
        if !vm.kayitlar.isEmpty {
            YuruyusGecmisiView(kayitlar: vm.kayitlar)
        }
    }

    private func gunIsimleri(_ gunler: [Int]) -> [String] {
        let isimler = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
        return gunler.compactMap { gun in
            guard gun >= 1 && gun <= 7 else { return nil }
            return isimler[gun - 1]
        }
    }
}
