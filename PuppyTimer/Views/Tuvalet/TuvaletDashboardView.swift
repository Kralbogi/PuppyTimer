import SwiftUI
import SwiftData

struct TuvaletDashboardView: View {
    let kopek: Kopek
    @Environment(\.modelContext) private var modelContext
    @State private var viewModel: TuvaletViewModel?
    @State private var secilenTab = 0
    @State private var buyukEkleGoster = false
    @State private var kucukEkleGoster = false
    @State private var analizYapilanKayit: TuvaletKaydi?
    @State private var analizYapiliyor = false
    @State private var analizHatasi: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Baslik + Hizli butonlar
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Tuvalet Takibi")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    Text("\(kopek.ad) için tuvalet kayıtları")
                        .foregroundStyle(.secondary)
                }

                Spacer()

                HStack(spacing: 12) {
                    Button {
                        buyukEkleGoster = true
                    } label: {
                        Label("Büyük Tuvalet", systemImage: "leaf.fill")
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.brown)

                    Button {
                        kucukEkleGoster = true
                    } label: {
                        Label("Küçük Tuvalet", systemImage: "drop.fill")
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.yellow)
                }
            }
            .padding(24)

            // Uyari banner
            if let vm = viewModel, !vm.sonUyarilar.isEmpty {
                uyariBanner(vm: vm)
            }

            // Tab secimi
            Picker("Bölüm", selection: $secilenTab) {
                Text("Genel Bakış").tag(0)
                Text("Büyük Tuvalet").tag(1)
                Text("Küçük Tuvalet").tag(2)
                Text("Geçmiş").tag(3)
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
                        case 1: buyukTuvaletListesi(vm: vm)
                        case 2: kucukTuvaletListesi(vm: vm)
                        case 3: TuvaletGecmisiView(kayitlar: vm.kayitlar, viewModel: vm)
                        default: genelBakis(vm: vm)
                        }
                    }
                }
                .padding(24)
            }
        }
        .sheet(isPresented: $buyukEkleGoster) {
            BuyukTuvaletEkleView(kopek: kopek) { kayit in
                viewModel?.verileriGetir()
            }
        }
        .sheet(isPresented: $kucukEkleGoster) {
            KucukTuvaletEkleView(kopek: kopek) {
                viewModel?.verileriGetir()
            }
        }
        .onAppear {
            viewModel = TuvaletViewModel(modelContext: modelContext, kopek: kopek)
        }
    }

    // MARK: - Uyari Banner

    private func uyariBanner(vm: TuvaletViewModel) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.white)
            Text("Son kayıtlarda dikkat edilmesi gereken durumlar tespit edildi!")
                .font(.caption)
                .foregroundStyle(.white)
            Spacer()
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 8).fill(.red))
        .padding(.horizontal, 24)
        .padding(.bottom, 8)
    }

    // MARK: - Genel Bakis

    @ViewBuilder
    private func genelBakis(vm: TuvaletViewModel) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            // Bugunun ozeti
            HStack(spacing: 16) {
                istatistikKart(
                    baslik: "Büyük Tuvalet",
                    sayi: vm.bugunBuyukSayisi,
                    ikon: "leaf.fill",
                    renk: .brown
                )
                istatistikKart(
                    baslik: "Küçük Tuvalet",
                    sayi: vm.bugunKucukSayisi,
                    ikon: "drop.fill",
                    renk: .yellow
                )
                istatistikKart(
                    baslik: "Toplam Kayıt",
                    sayi: vm.kayitlar.count,
                    ikon: "list.clipboard",
                    renk: .blue
                )
                istatistikKart(
                    baslik: "Uyarı",
                    sayi: vm.sonUyarilar.count,
                    ikon: "exclamationmark.triangle",
                    renk: .red
                )
            }

            // Son kayitlar
            if !vm.bugunKayitlar.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Bugünün Kayıtları")
                        .font(.title2)
                        .fontWeight(.bold)

                    ForEach(vm.bugunKayitlar) { kayit in
                        tuvaletKayitSatir(kayit)
                    }
                }
            }

            // Son uyarilar
            if !vm.sonUyarilar.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Son Uyarılar")
                        .font(.title2)
                        .fontWeight(.bold)

                    ForEach(vm.sonUyarilar) { kayit in
                        tuvaletKayitSatir(kayit)
                    }
                }
            }
        }
    }

    // MARK: - Listeler

    @ViewBuilder
    private func buyukTuvaletListesi(vm: TuvaletViewModel) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Büyük Tuvalet Kayıtları")
                .font(.title2)
                .fontWeight(.bold)

            if vm.buyukTuvaletKayitlari.isEmpty {
                ContentUnavailableView("Henüz kayıt yok", systemImage: "leaf", description: Text("Büyük tuvalet kaydı ekleyin."))
            } else {
                ForEach(vm.buyukTuvaletKayitlari) { kayit in
                    buyukTuvaletKart(kayit)
                }
            }
        }
    }

    @ViewBuilder
    private func kucukTuvaletListesi(vm: TuvaletViewModel) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Küçük Tuvalet Kayıtları")
                .font(.title2)
                .fontWeight(.bold)

            if vm.kucukTuvaletKayitlari.isEmpty {
                ContentUnavailableView("Henüz kayıt yok", systemImage: "drop", description: Text("Küçük tuvalet kaydı ekleyin."))
            } else {
                ForEach(vm.kucukTuvaletKayitlari) { kayit in
                    tuvaletKayitSatir(kayit)
                }
            }
        }
    }

    // MARK: - Kartlar

    private func istatistikKart(baslik: String, sayi: Int, ikon: String, renk: Color) -> some View {
        VStack(spacing: 8) {
            Image(systemName: ikon)
                .font(.title2)
                .foregroundStyle(renk)
            Text("\(sayi)")
                .font(.title)
                .fontWeight(.bold)
            Text(baslik)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(renk.opacity(0.1))
        )
    }

    private func tuvaletKayitSatir(_ kayit: TuvaletKaydi) -> some View {
        HStack(spacing: 12) {
            Image(systemName: kayit.tur == .buyuk ? "leaf.fill" : "drop.fill")
                .foregroundStyle(kayit.tur == .buyuk ? .brown : .yellow)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(kayit.tur.baslik)
                        .fontWeight(.medium)
                    if kayit.uyariVar {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundStyle(.red)
                            .font(.caption)
                    }
                }

                if kayit.tur == .buyuk {
                    HStack(spacing: 8) {
                        if let renk = kayit.diskiRenk {
                            Text(renk.baslik)
                                .font(.caption)
                                .foregroundStyle(renk.uyariMi ? .red : .secondary)
                        }
                        if let miktar = kayit.miktar {
                            Text(miktar.baslik)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                } else {
                    if let renk = kayit.idrarRenk {
                        Text(renk.baslik)
                            .font(.caption)
                            .foregroundStyle(renk.uyariMi ? .red : .secondary)
                    }
                }
            }

            Spacer()

            Text(kayit.tarih.turkceTarihSaat)
                .font(.caption)
                .foregroundStyle(.secondary)

            if kayit.fotoData != nil {
                Image(systemName: "camera.fill")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(kayit.uyariVar ? Color.red.opacity(0.05) : Color(.controlBackgroundColor))
                .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
        )
    }

    private func buyukTuvaletKart(_ kayit: TuvaletKaydi) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "leaf.fill")
                    .foregroundStyle(.brown)
                Text(kayit.tarih.turkceTarihSaat)
                    .fontWeight(.medium)
                if kayit.uyariVar {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.red)
                }
                Spacer()
                if kayit.yapayZekaAnalizi != nil {
                    Image(systemName: "sparkles")
                        .foregroundStyle(.purple)
                        .font(.caption)
                }
            }

            HStack(spacing: 16) {
                if let sekil = kayit.sekil {
                    Label(sekil.baslik, systemImage: sekil.ikon)
                        .font(.caption)
                }
                if let renk = kayit.diskiRenk {
                    Text("Renk: \(renk.baslik)")
                        .font(.caption)
                        .foregroundStyle(renk.uyariMi ? .red : .secondary)
                }
                if let kivam = kayit.kivam {
                    Text("Kıvam: \(kivam.baslik)")
                        .font(.caption)
                }
                if let miktar = kayit.miktar {
                    Text("Miktar: \(miktar.baslik)")
                        .font(.caption)
                }
            }
            .foregroundStyle(.secondary)

            if let analiz = kayit.yapayZekaAnalizi {
                Text(analiz)
                    .font(.caption)
                    .foregroundStyle(.purple)
                    .padding(8)
                    .background(RoundedRectangle(cornerRadius: 8).fill(.purple.opacity(0.05)))
            } else if kayit.fotoData != nil {
                if analizYapiliyor && analizYapilanKayit?.id == kayit.id {
                    HStack(spacing: 6) {
                        ProgressView()
                            .scaleEffect(0.7)
                        Text("Analiz ediliyor...")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                } else if AnahtarlikServisi.anahtarVarMi {
                    Button {
                        gecmistenAnalizBaslat(kayit)
                    } label: {
                        Label("AI ile Analiz Et", systemImage: "sparkles")
                            .font(.caption)
                    }
                    .buttonStyle(.bordered)
                    .tint(.purple)
                    .controlSize(.small)
                }
            }

            if analizYapilanKayit?.id == kayit.id, let hata = analizHatasi {
                Text(hata)
                    .font(.caption2)
                    .foregroundStyle(.red)
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.background)
                .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
        )
    }

    private func gecmistenAnalizBaslat(_ kayit: TuvaletKaydi) {
        guard let vm = viewModel else { return }
        analizYapilanKayit = kayit
        analizYapiliyor = true
        analizHatasi = nil
        Task {
            await vm.yapayZekaAnaliziBaslat(kayit)
            if let hata = vm.hata {
                analizHatasi = hata
            }
            analizYapiliyor = false
            vm.verileriGetir()
        }
    }
}
