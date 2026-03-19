import SwiftUI

struct BeslenmeGecmisiView: View {
    let kayitlar: [BeslenmeKaydi]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Beslenme Geçmişi")
                .font(.title2)
                .fontWeight(.bold)

            if kayitlar.isEmpty {
                Text("Henüz kayıt yok.")
                    .foregroundStyle(.secondary)
                    .padding()
            } else {
                ForEach(Array(kayitlar.prefix(20))) { kayit in
                    HStack(spacing: 12) {
                        Image(systemName: kayit.tur == .mama ? "fork.knife" : "drop.fill")
                            .foregroundStyle(kayit.tur == .mama ? .orange : .blue)
                            .frame(width: 24)

                        VStack(alignment: .leading) {
                            Text(kayit.tur.rawValue)
                                .fontWeight(.medium)

                            if let miktar = kayit.miktar {
                                Text(miktar)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        Spacer()

                        Text(kayit.tarih.turkceTarihSaat)
                            .font(.caption)
                            .foregroundStyle(.secondary)
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
}
