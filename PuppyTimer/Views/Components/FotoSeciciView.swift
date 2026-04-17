import SwiftUI
import PhotosUI

struct FotoSeciciView: View {
    @Binding var fotoData: Data?
    var placeholder: String = "Fotoğraf Seç"
    var maxBoyut: CGFloat = 200

    @State private var secilenFoto: PhotosPickerItem?

    var body: some View {
        VStack(spacing: 12) {
            if let data = fotoData, let nsImage = NSImage(data: data) {
                ZStack(alignment: .topTrailing) {
                    Image(nsImage: nsImage)
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: maxBoyut)
                        .clipShape(RoundedRectangle(cornerRadius: 12))

                    Button {
                        fotoData = nil
                        secilenFoto = nil
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                            .foregroundStyle(.white)
                            .background(Circle().fill(.black.opacity(0.5)))
                    }
                    .buttonStyle(.plain)
                    .padding(8)
                }
            } else {
                // Placeholder
                VStack(spacing: 8) {
                    Image(systemName: "photo.on.rectangle.angled")
                        .font(.largeTitle)
                        .foregroundStyle(.secondary)
                    Text(placeholder)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .frame(height: maxBoyut * 0.6)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .strokeBorder(style: StrokeStyle(lineWidth: 2, dash: [8]))
                        .foregroundStyle(.secondary.opacity(0.3))
                )
            }

            PhotosPicker(selection: $secilenFoto, matching: .images) {
                Label(fotoData == nil ? placeholder : "Değiştir", systemImage: "photo")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
        }
        .onChange(of: secilenFoto) { _, yeni in
            Task {
                if let data = try? await yeni?.loadTransferable(type: Data.self) {
                    fotoData = data
                }
            }
        }
    }
}
