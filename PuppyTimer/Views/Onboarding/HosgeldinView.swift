import SwiftUI

struct HosgeldinView: View {
    var viewModel: OnboardingViewModel
    @State private var gorundu = false
    @State private var patiAnimasyon = false

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            // Animasyonlu pati ikonu
            ZStack {
                // Parlama halkasi
                ForEach(0..<3, id: \.self) { i in
                    Circle()
                        .fill(Color.orange.opacity(0.08 - Double(i) * 0.02))
                        .frame(width: 120 + CGFloat(i) * 30, height: 120 + CGFloat(i) * 30)
                        .scaleEffect(patiAnimasyon ? 1.1 : 0.9)
                        .animation(
                            .easeInOut(duration: 2.0)
                            .repeatForever(autoreverses: true)
                            .delay(Double(i) * 0.3),
                            value: patiAnimasyon
                        )
                }

                Image(systemName: "pawprint.fill")
                    .font(.system(size: 72))
                    .foregroundStyle(.orange)
                    .shadow(color: Color.orange.opacity(0.3), radius: 16)
                    .scaleEffect(gorundu ? 1.0 : 0.2)
                    .rotationEffect(.degrees(gorundu ? 0 : -20))
            }

            Text("PuppyTimer'a Hoş Geldiniz!")
                .font(.largeTitle)
                .fontWeight(.bold)
                .opacity(gorundu ? 1.0 : 0)
                .offset(y: gorundu ? 0 : 20)

            Text("Köpeğinizin beslenme, yürüyüş, sağlık ve tuvalet\ntakibini kolayca yapın.")
                .font(.title3)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .opacity(gorundu ? 1.0 : 0)
                .offset(y: gorundu ? 0 : 15)

            // Ozellik ikonlari
            HStack(spacing: 24) {
                ozellikIkon("fork.knife", "Beslenme", .orange)
                ozellikIkon("figure.walk", "Yürüyüş", .green)
                ozellikIkon("heart.fill", "Sağlık", .red)
                ozellikIkon("map", "Harita", .blue)
            }
            .opacity(gorundu ? 1.0 : 0)
            .offset(y: gorundu ? 0 : 10)

            Spacer()

            Button {
                viewModel.ileri()
            } label: {
                Text("Başlayalım")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .frame(maxWidth: 300)
            }
            .buttonStyle(.borderedProminent)
            .tint(.orange)
            .controlSize(.large)
            .scaleEffect(gorundu ? 1.0 : 0.8)
            .opacity(gorundu ? 1.0 : 0)

            Spacer()
                .frame(height: 40)
        }
        .padding(40)
        .onAppear {
            withAnimation(.spring(response: 0.7, dampingFraction: 0.6)) {
                gorundu = true
            }
            patiAnimasyon = true
        }
    }

    private func ozellikIkon(_ ikon: String, _ baslik: String, _ renk: Color) -> some View {
        VStack(spacing: 6) {
            Image(systemName: ikon)
                .font(.title2)
                .foregroundStyle(renk)
            Text(baslik)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }
}
