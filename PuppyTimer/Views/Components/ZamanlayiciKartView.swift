import SwiftUI

struct ZamanlayiciKartView: View {
    let baslik: String
    let kalanSure: TimeInterval
    let toplamSure: TimeInterval
    let renk: Color
    let tamamlaAction: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            Text(baslik)
                .font(.headline)
                .foregroundStyle(.secondary)

            GeriSayimCircleView(
                kalanSure: kalanSure,
                toplamSure: toplamSure,
                renk: renk
            )
            .frame(width: 120, height: 120)

            if kalanSure <= 0 {
                Text("Vakit geldi!")
                    .font(.caption)
                    .foregroundStyle(.red)
                    .fontWeight(.semibold)
            }

            Button(action: tamamlaAction) {
                Label("Tamamlandi", systemImage: "checkmark.circle.fill")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(renk)
            .controlSize(.large)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.background)
                .shadow(color: .black.opacity(0.1), radius: 8, y: 4)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(renk.opacity(0.3), lineWidth: 1)
        )
    }
}
