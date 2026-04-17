import SwiftUI

struct IsaretciGorunumu: View {
    let isaretci: HaritaIsaretci

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
        VStack(spacing: 2) {
            ZStack {
                Circle()
                    .fill(renk)
                    .frame(width: 32, height: 32)
                    .shadow(color: renk.opacity(0.4), radius: 4, y: 2)

                Image(systemName: isaretci.tur.ikon)
                    .font(.system(size: 14))
                    .foregroundStyle(.white)
            }

            // Kucuk ucgen (pin alt kismi)
            Triangle()
                .fill(renk)
                .frame(width: 10, height: 6)
                .offset(y: -2)
        }
    }
}

struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.midX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
        path.closeSubpath()
        return path
    }
}
