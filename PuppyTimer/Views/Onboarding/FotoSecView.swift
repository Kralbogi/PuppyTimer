import SwiftUI
import PhotosUI
import UniformTypeIdentifiers

struct FotoSecOnboardingView: View {
    var viewModel: OnboardingViewModel
    @State private var secilenFoto: PhotosPickerItem?
    @State private var suruklemeAktif = false

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Text("Köpeğinizin Fotoğrafını Seçin")
                .font(.title)
                .fontWeight(.bold)

            Text("Fotoğrafı sürükleyip bırakın veya aşağıdan seçin.")
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            // Foto alani (drop zone)
            fotoAlani
                .onDrop(of: [.image, .fileURL], isTargeted: $suruklemeAktif) { providers in
                    dosyaBirak(providers)
                }

            HStack(spacing: 12) {
                PhotosPicker(selection: $secilenFoto, matching: .images) {
                    Label(
                        viewModel.kopekFoto == nil ? "Kütüphane" : "Değiştir",
                        systemImage: "photo"
                    )
                    .frame(maxWidth: 120)
                }
                .buttonStyle(.bordered)
                .controlSize(.large)

                Button {
                    dosyaSeciciAc()
                } label: {
                    Label("Dosyadan Seç", systemImage: "folder")
                        .frame(maxWidth: 120)
                }
                .buttonStyle(.bordered)
                .controlSize(.large)
            }

            Spacer()

            // Navigasyon
            HStack {
                Button("Geri") {
                    viewModel.geri()
                }

                Spacer()

                if viewModel.kopekFoto != nil {
                    Button("Devam") {
                        viewModel.ileri()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.orange)
                }

                Button("Fotoğrafsız Devam Et") {
                    viewModel.adim = .bilgiGir
                }
                .foregroundStyle(.secondary)
                .font(.caption)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
        }
        .padding(20)
        .onChange(of: secilenFoto) { _, yeni in
            Task {
                if let data = try? await yeni?.loadTransferable(type: Data.self) {
                    viewModel.kopekFoto = data
                }
            }
        }
    }

    // MARK: - Foto Alani

    @ViewBuilder
    private var fotoAlani: some View {
        if let data = viewModel.kopekFoto, let nsImage = NSImage(data: data) {
            Image(nsImage: nsImage)
                .resizable()
                .scaledToFit()
                .frame(maxWidth: 250, maxHeight: 250)
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .shadow(color: .black.opacity(0.1), radius: 8, y: 4)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(suruklemeAktif ? Color.orange : Color.clear, lineWidth: 3)
                )
        } else {
            VStack(spacing: 12) {
                Image(systemName: suruklemeAktif ? "arrow.down.doc.fill" : "camera.fill")
                    .font(.system(size: 48))
                    .foregroundStyle(suruklemeAktif ? .orange : .secondary)
                Text(suruklemeAktif ? "Bırakın!" : "Fotoğrafı buraya sürükleyin")
                    .font(.caption)
                    .foregroundStyle(suruklemeAktif ? .orange : .secondary)
            }
            .frame(width: 250, height: 200)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .strokeBorder(
                        style: StrokeStyle(lineWidth: 2, dash: [10])
                    )
                    .foregroundStyle(suruklemeAktif ? Color.orange : Color.secondary.opacity(0.3))
            )
            .animation(.easeInOut(duration: 0.2), value: suruklemeAktif)
        }
    }

    // MARK: - Surukle Birak

    private func dosyaBirak(_ providers: [NSItemProvider]) -> Bool {
        guard let provider = providers.first else { return false }

        // Oncelik: image data
        if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
            provider.loadDataRepresentation(forTypeIdentifier: UTType.image.identifier) { data, _ in
                if let data = data {
                    DispatchQueue.main.async {
                        viewModel.kopekFoto = data
                    }
                }
            }
            return true
        }

        // Dosya URL'si
        if provider.hasItemConformingToTypeIdentifier(UTType.fileURL.identifier) {
            provider.loadItem(forTypeIdentifier: UTType.fileURL.identifier, options: nil) { item, _ in
                guard let data = item as? Data,
                      let url = URL(dataRepresentation: data, relativeTo: nil),
                      let imageData = try? Data(contentsOf: url) else { return }
                DispatchQueue.main.async {
                    viewModel.kopekFoto = imageData
                }
            }
            return true
        }

        return false
    }

    // MARK: - Dosya Secici (NSOpenPanel)

    private func dosyaSeciciAc() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.image]
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        panel.message = "Köpek fotoğrafı seçin"

        if panel.runModal() == .OK, let url = panel.url {
            if let data = try? Data(contentsOf: url) {
                viewModel.kopekFoto = data
            }
        }
    }
}
