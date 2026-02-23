import SwiftUI
import SwiftData

struct KopekDetailView: View {
    @Bindable var kopek: Kopek
    @Environment(\.modelContext) private var modelContext
    @State private var duzenleModu = false
    @State private var animasyonBasladi = false
    @State private var kartGorundu: [Bool] = Array(repeating: false, count: 6)
    @State private var patiNabiz = false

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                profilBaslik
                bilgiKartlari
                ozetIstatistikler
            }
            .padding(24)
        }
        .navigationTitle(kopek.ad)
        .toolbar {
            ToolbarItem {
                Button(duzenleModu ? "Bitti" : "Düzenle") {
                    duzenleModu.toggle()
                    if !duzenleModu {
                        try? modelContext.save()
                    }
                }
            }
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.6)) {
                animasyonBasladi = true
            }
            for i in 0..<kartGorundu.count {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.7).delay(Double(i) * 0.08 + 0.3)) {
                    kartGorundu[i] = true
                }
            }
            patiNabiz = true
        }
    }

    // MARK: - Profil Baslik

    private var profilBaslik: some View {
        VStack(spacing: 16) {
            AnimatedKopekView(kopek: kopek, avatarBoyut: 140)

            if duzenleModu {
                TextField("Ad", text: $kopek.ad)
                    .textFieldStyle(.roundedBorder)
                    .frame(maxWidth: 200)
                    .multilineTextAlignment(.center)
            } else {
                Text(kopek.ad)
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .opacity(animasyonBasladi ? 1.0 : 0)
                    .offset(y: animasyonBasladi ? 0 : 10)
            }

            HStack(spacing: 6) {
                Text(kopek.irk.isEmpty ? "Irk belirtilmemiş" : kopek.irk)
                    .font(.title3)
                    .foregroundStyle(.secondary)

                if kopek.renkTanimi != nil || kopek.irkTanimi != nil {
                    Image(systemName: "sparkles")
                        .font(.caption)
                        .foregroundStyle(.orange)
                }
            }
            .opacity(animasyonBasladi ? 1.0 : 0)

            if let tanim = kopek.irkTanimi, !tanim.isEmpty {
                Text(tanim)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                    .opacity(animasyonBasladi ? 0.8 : 0)
            }
        }
    }

    // MARK: - Bilgi Kartlari

    private var bilgiKartlari: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 16) {
            bilgiKarti(baslik: "Cinsiyet", deger: kopek.cinsiyet.baslik,
                        ikon: kopek.cinsiyet == .erkek ? "figure.stand" : "figure.stand.dress",
                        renk: kopek.cinsiyet == .erkek ? .blue : .pink, index: 0)

            bilgiKarti(baslik: "Ağırlık",
                        deger: kopek.agirlik != nil ? String(format: "%.1f kg", kopek.agirlik!) : "-",
                        ikon: "scalemass", renk: .orange, index: 1)

            bilgiKarti(baslik: "Yaş", deger: yasHesapla(),
                        ikon: "birthday.cake", renk: .purple, index: 2)
        }
    }

    private func bilgiKarti(baslik: String, deger: String, ikon: String, renk: Color, index: Int) -> some View {
        VStack(spacing: 8) {
            Image(systemName: ikon)
                .font(.title2)
                .foregroundStyle(renk)

            Text(deger)
                .font(.title3)
                .fontWeight(.semibold)

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
        .scaleEffect(safeKartGorundu(index) ? 1.0 : 0.8)
        .opacity(safeKartGorundu(index) ? 1.0 : 0)
    }

    // MARK: - Ozet Istatistikler

    private var ozetIstatistikler: some View {
        VStack(alignment: .leading, spacing: 16) {
            ozetBaslik
            ozetGrid
            tuvaletUyarilari
        }
    }

    private var ozetBaslik: some View {
        HStack {
            Text("Özet")
                .font(.title2)
                .fontWeight(.bold)

            Spacer()

            HStack(spacing: 4) {
                ForEach(0..<3, id: \.self) { i in
                    Image(systemName: "pawprint.fill")
                        .font(.caption2)
                        .foregroundStyle(Color.orange.opacity(0.4))
                        .scaleEffect(patiNabiz ? 1.0 : 0.6)
                        .animation(
                            .easeInOut(duration: 0.8)
                            .repeatForever(autoreverses: true)
                            .delay(Double(i) * 0.2),
                            value: patiNabiz
                        )
                }
            }
        }
    }

    private var ozetGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ozetKutu(baslik: "Aktif Zamanlayıcı",
                      sayi: kopek.beslenmeProgramlari.filter(\.aktif).count +
                            kopek.suProgramlari.filter(\.aktif).count,
                      ikon: "timer", renk: .orange, index: 0)

            ozetKutu(baslik: "Yürüyüş Programı",
                      sayi: kopek.yuruyusProgramlari.filter(\.aktif).count,
                      ikon: "figure.walk", renk: .green, index: 1)

            ozetKutu(baslik: "Aşı Kaydı", sayi: kopek.asiKayitlari.count,
                      ikon: "syringe", renk: .red, index: 2)

            ozetKutu(baslik: "Aktif İlaç", sayi: kopek.ilaclar.filter(\.aktif).count,
                      ikon: "pill", renk: .blue, index: 3)

            ozetKutu(baslik: "Tuvalet (Bugün)",
                      sayi: kopek.tuvaletKayitlari.filter { $0.tarih.bugunMu }.count,
                      ikon: "leaf.fill", renk: .brown, index: 4)

            ozetKutu(baslik: "Harita İşaretçi", sayi: kopek.haritaIsaretcileri.count,
                      ikon: "map", renk: .teal, index: 5)
        }
    }

    private func ozetKutu(baslik: String, sayi: Int, ikon: String, renk: Color, index: Int) -> some View {
        HStack {
            Image(systemName: ikon)
                .font(.title3)
                .foregroundStyle(renk)
                .frame(width: 32)

            VStack(alignment: .leading) {
                Text("\(sayi)")
                    .font(.title2)
                    .fontWeight(.bold)
                    .contentTransition(.numericText())
                Text(baslik)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.controlBackgroundColor))
                .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
        )
        .scaleEffect(safeKartGorundu(index) ? 1.0 : 0.8)
        .opacity(safeKartGorundu(index) ? 1.0 : 0)
    }

    @ViewBuilder
    private var tuvaletUyarilari: some View {
        let uyarilar = kopek.tuvaletKayitlari.filter(\.uyariVar).sorted(by: { $0.tarih > $1.tarih }).prefix(3)
        if !uyarilar.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Label("Son Uyarılar", systemImage: "exclamationmark.triangle.fill")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.red)

                ForEach(Array(uyarilar)) { kayit in
                    HStack {
                        Text(kayit.tur.baslik)
                            .font(.caption)
                            .fontWeight(.medium)
                        Text(kayit.tarih.turkceTarihSaat)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Spacer()
                        if let analiz = kayit.yapayZekaAnalizi {
                            Text(analiz.prefix(50) + "...")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.red.opacity(0.05))
            )
        }
    }

    // MARK: - Yardimcilar

    private func safeKartGorundu(_ index: Int) -> Bool {
        guard index < kartGorundu.count else { return false }
        return kartGorundu[index]
    }

    private func yasHesapla() -> String {
        guard let dogum = kopek.dogumTarihi else { return "-" }
        let takvim = Calendar.current
        let fark = takvim.dateComponents([.year, .month], from: dogum, to: Date())
        if let yil = fark.year, yil > 0 {
            return "\(yil) yil"
        } else if let ay = fark.month {
            return "\(ay) ay"
        }
        return "-"
    }
}
