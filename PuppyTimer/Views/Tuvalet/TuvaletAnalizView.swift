import SwiftUI

struct TuvaletAnalizView: View {
    let analiz: DiskiAnalizi

    var durumRenk: Color {
        switch analiz.durum {
        case "acil": return .red
        case "dikkat": return .orange
        default: return .green
        }
    }

    var durumIkon: String {
        switch analiz.durum {
        case "acil": return "exclamationmark.triangle.fill"
        case "dikkat": return "exclamationmark.circle.fill"
        default: return "checkmark.circle.fill"
        }
    }

    var durumMetin: String {
        switch analiz.durum {
        case "acil": return "Acil Durum"
        case "dikkat": return "Dikkat Gerekli"
        default: return "Normal"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Durum gostergesi
            HStack(spacing: 8) {
                Image(systemName: durumIkon)
                    .foregroundStyle(durumRenk)
                    .font(.title3)
                Text(durumMetin)
                    .font(.headline)
                    .foregroundStyle(durumRenk)
            }

            // Aciklama
            Text(analiz.aciklama)
                .font(.body)

            // Oneriler
            if !analiz.oneriler.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Öneriler:")
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    ForEach(analiz.oneriler, id: \.self) { oneri in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "arrow.right.circle")
                                .font(.caption)
                                .foregroundStyle(durumRenk)
                                .padding(.top, 2)
                            Text(oneri)
                                .font(.caption)
                        }
                    }
                }
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(durumRenk.opacity(0.08))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(durumRenk.opacity(0.3), lineWidth: 1)
        )
    }
}
