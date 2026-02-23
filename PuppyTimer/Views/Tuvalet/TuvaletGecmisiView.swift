import SwiftUI

struct TuvaletGecmisiView: View {
    let kayitlar: [TuvaletKaydi]
    var viewModel: TuvaletViewModel

    @State private var turFiltresi: TuvaletTuru?

    var filtrelenmisKayitlar: [TuvaletKaydi] {
        if let tur = turFiltresi {
            return kayitlar.filter { $0.tur == tur }
        }
        return kayitlar
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Tuvalet Geçmişi")
                    .font(.title2)
                    .fontWeight(.bold)

                Spacer()

                // Filtre
                HStack(spacing: 8) {
                    filtreButon(nil, metin: "Tümü")
                    filtreButon(.buyuk, metin: "Büyük")
                    filtreButon(.kucuk, metin: "Küçük")
                }
            }

            if filtrelenmisKayitlar.isEmpty {
                ContentUnavailableView(
                    "Henüz kayıt yok",
                    systemImage: "list.clipboard",
                    description: Text("Tuvalet kaydı eklendiğinde burada görünecek.")
                )
            } else {
                ForEach(filtrelenmisKayitlar) { kayit in
                    gecmisKart(kayit)
                }
            }
        }
    }

    private func filtreButon(_ tur: TuvaletTuru?, metin: String) -> some View {
        Button(metin) {
            turFiltresi = tur
        }
        .buttonStyle(.bordered)
        .tint(turFiltresi == tur ? .blue : .secondary)
        .controlSize(.small)
    }

    private func gecmisKart(_ kayit: TuvaletKaydi) -> some View {
        HStack(spacing: 12) {
            // Ikon
            VStack {
                Image(systemName: kayit.tur == .buyuk ? "leaf.fill" : "drop.fill")
                    .foregroundStyle(kayit.tur == .buyuk ? .brown : .yellow)
                    .font(.title3)

                if kayit.uyariVar {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.red)
                        .font(.caption2)
                }
            }
            .frame(width: 32)

            // Detaylar
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(kayit.tur.baslik)
                        .fontWeight(.medium)
                    Text(kayit.tarih.turkceTarihSaat)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                if kayit.tur == .buyuk {
                    HStack(spacing: 8) {
                        if let sekil = kayit.sekil { etiket(sekil.baslik) }
                        if let renk = kayit.diskiRenk { etiket(renk.baslik, uyari: renk.uyariMi) }
                        if let kivam = kayit.kivam { etiket(kivam.baslik) }
                        if let miktar = kayit.miktar { etiket(miktar.baslik) }
                    }
                } else {
                    HStack(spacing: 8) {
                        if let renk = kayit.idrarRenk { etiket(renk.baslik, uyari: renk.uyariMi) }
                        if let miktar = kayit.idrarMiktar { etiket(miktar.baslik) }
                    }
                }

                if let not = kayit.not {
                    Text(not)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                if let analiz = kayit.yapayZekaAnalizi {
                    HStack(spacing: 4) {
                        Image(systemName: "sparkles")
                            .font(.caption2)
                        Text(analiz)
                            .font(.caption)
                    }
                    .foregroundStyle(.purple)
                }
            }

            Spacer()

            // Foto ve konum ikonlari
            HStack(spacing: 6) {
                if kayit.fotoData != nil {
                    Image(systemName: "camera.fill")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                if kayit.enlem != nil {
                    Image(systemName: "location.fill")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Button(role: .destructive) {
                viewModel.kayitSil(kayit)
            } label: {
                Image(systemName: "trash")
                    .font(.caption)
            }
            .buttonStyle(.plain)
            .foregroundStyle(.red)
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(kayit.uyariVar ? Color.red.opacity(0.05) : Color(.controlBackgroundColor))
                .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
        )
    }

    private func etiket(_ metin: String, uyari: Bool = false) -> some View {
        Text(metin)
            .font(.caption2)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(
                Capsule().fill(uyari ? .red.opacity(0.2) : .secondary.opacity(0.15))
            )
            .foregroundStyle(uyari ? .red : .secondary)
    }
}
