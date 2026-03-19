import SwiftUI

struct HaritaFiltresiView: View {
    var viewModel: HaritaViewModel

    var body: some View {
        HStack(spacing: 8) {
            ForEach(IsaretciTuru.allCases, id: \.self) { tur in
                let aktif = viewModel.secilenFiltreler.contains(tur)
                let sayi = viewModel.isaretciler.filter { $0.tur == tur }.count

                Button {
                    viewModel.filtreToggle(tur)
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: tur.ikon)
                            .font(.caption2)
                        Text(tur.baslik)
                            .font(.caption2)
                        if sayi > 0 {
                            Text("\(sayi)")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .padding(.horizontal, 4)
                                .padding(.vertical, 1)
                                .background(Capsule().fill(.white.opacity(0.3)))
                        }
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        Capsule().fill(aktif ? turRenk(tur).opacity(0.2) : .secondary.opacity(0.1))
                    )
                    .foregroundStyle(aktif ? turRenk(tur) : .secondary)
                }
                .buttonStyle(.plain)
            }

            Spacer()
        }
    }

    private func turRenk(_ tur: IsaretciTuru) -> Color {
        switch tur {
        case .yuruyus: return .green
        case .buyukTuvalet: return .brown
        case .kucukTuvalet: return .yellow
        case .favori: return .orange
        case .diger: return .gray
        }
    }
}
