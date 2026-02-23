import SwiftUI

struct YuruyusGecmisiView: View {
    let kayitlar: [YuruyusKaydi]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Yürüyüş Geçmişi")
                .font(.title2)
                .fontWeight(.bold)

            ForEach(Array(kayitlar.prefix(20))) { kayit in
                HStack(spacing: 12) {
                    Image(systemName: kayit.tamamlandi ? "checkmark.circle.fill" : "xmark.circle")
                        .foregroundStyle(kayit.tamamlandi ? .green : .red)
                        .frame(width: 24)

                    VStack(alignment: .leading) {
                        Text(kayit.baslamaTarihi.turkceTarih)
                            .fontWeight(.medium)

                        HStack {
                            Text(kayit.baslamaTarihi.turkceSaat)
                            if let bitis = kayit.bitisTarihi {
                                Text("-")
                                Text(bitis.turkceSaat)
                            }
                        }
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    }

                    Spacer()

                    if let sure = kayit.sure {
                        Text("\(sure) dk")
                            .font(.callout)
                            .fontWeight(.semibold)
                            .foregroundStyle(.green)
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
