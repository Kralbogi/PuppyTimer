import SwiftUI
import AppKit

struct TamamlandiView: View {
    var viewModel: OnboardingViewModel
    var onTamamla: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 64))
                .foregroundStyle(.green)

            Text("Hazırız!")
                .font(.title)
                .fontWeight(.bold)

            Text("Köpeğinizin profili oluşturuldu.")
                .foregroundStyle(.secondary)

            // Profil karti
            VStack(spacing: 16) {
                if let data = viewModel.avatarData, let nsImage = NSImage(data: data) {
                    Image(nsImage: nsImage)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 120, height: 120)
                        .clipShape(Circle())
                        .shadow(color: .orange.opacity(0.3), radius: 8, y: 4)
                } else if let data = viewModel.kopekFoto, let nsImage = NSImage(data: data) {
                    Image(nsImage: nsImage)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 120, height: 120)
                        .clipShape(Circle())
                } else {
                    Image(systemName: "pawprint.circle.fill")
                        .font(.system(size: 80))
                        .foregroundStyle(.orange)
                }

                VStack(spacing: 4) {
                    Text(viewModel.kopekAdi.isEmpty ? "Köpek" : viewModel.kopekAdi)
                        .font(.title2)
                        .fontWeight(.bold)

                    if !viewModel.kopekIrk.isEmpty {
                        Text(viewModel.kopekIrk)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding(24)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(.background)
                    .shadow(color: .black.opacity(0.08), radius: 12, y: 4)
            )

            Spacer()

            Button {
                let _ = viewModel.kaydet()
                onTamamla()
            } label: {
                Text("Başla")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .frame(maxWidth: 250)
            }
            .buttonStyle(.borderedProminent)
            .tint(.orange)
            .controlSize(.large)
            .padding(.bottom, 20)
        }
        .padding(20)
    }
}
