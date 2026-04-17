import SwiftUI

struct GeriSayimCircleView: View {
    let kalanSure: TimeInterval
    let toplamSure: TimeInterval
    let renk: Color

    var ilerleme: Double {
        guard toplamSure > 0 else { return 0 }
        return 1.0 - (kalanSure / toplamSure)
    }

    var body: some View {
        ZStack {
            Circle()
                .stroke(renk.opacity(0.2), lineWidth: 8)

            Circle()
                .trim(from: 0, to: max(ilerleme, 0))
                .stroke(renk, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.linear(duration: 1), value: ilerleme)

            Text(ZamanlayiciServisi.kalanSureMetni(kalanSure))
                .font(.system(.title2, design: .monospaced))
                .fontWeight(.semibold)
                .foregroundStyle(kalanSure <= 0 ? .red : .primary)
        }
    }
}
