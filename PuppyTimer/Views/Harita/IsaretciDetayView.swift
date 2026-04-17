import SwiftUI
import MapKit

struct IsaretciDetayView: View {
    let isaretci: HaritaIsaretci
    var onSil: () -> Void

    @Environment(\.dismiss) private var dismiss

    var renk: Color {
        switch isaretci.tur {
        case .yuruyus: return .green
        case .buyukTuvalet: return .brown
        case .kucukTuvalet: return .yellow
        case .favori: return .orange
        case .diger: return .gray
        }
    }

    var body: some View {
        VStack(spacing: 16) {
            // Baslik
            HStack {
                Image(systemName: isaretci.tur.ikon)
                    .foregroundStyle(renk)
                    .font(.title2)
                Text(isaretci.baslik)
                    .font(.title2)
                    .fontWeight(.bold)
                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)

            // Mini harita
            Map {
                Annotation(isaretci.baslik, coordinate: CLLocationCoordinate2D(
                    latitude: isaretci.enlem, longitude: isaretci.boylam
                )) {
                    IsaretciGorunumu(isaretci: isaretci)
                }
            }
            .frame(height: 150)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal, 20)
            .allowsHitTesting(false)

            // Detaylar
            VStack(alignment: .leading, spacing: 12) {
                detaySatir(baslik: "Tür", deger: isaretci.tur.baslik)
                detaySatir(baslik: "Tarih", deger: isaretci.tarih.turkceTarihSaat)
                detaySatir(
                    baslik: "Konum",
                    deger: String(format: "%.5f, %.5f", isaretci.enlem, isaretci.boylam)
                )

                if let not = isaretci.not {
                    detaySatir(baslik: "Not", deger: not)
                }
            }
            .padding(.horizontal, 20)

            Spacer()

            // Butonlar
            HStack {
                Button("Sil", role: .destructive) {
                    onSil()
                    dismiss()
                }

                Spacer()

                Button("Kapat") {
                    dismiss()
                }
                .keyboardShortcut(.cancelAction)
            }
            .padding(20)
        }
        .frame(width: 380, height: 450)
    }

    private func detaySatir(baslik: String, deger: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(baslik)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(deger)
                .font(.body)
        }
    }
}
