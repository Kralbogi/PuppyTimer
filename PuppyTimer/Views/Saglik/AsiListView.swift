import SwiftUI

struct AsiListView: View {
    var viewModel: SaglikViewModel
    @State private var ekleGoster = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Aşı Kayıtları")
                    .font(.title2)
                    .fontWeight(.bold)
                Spacer()
                Button("Aşı Ekle", systemImage: "plus") {
                    ekleGoster = true
                }
            }

            if viewModel.asilar.isEmpty {
                ContentUnavailableView(
                    "Henüz aşı kaydı yok",
                    systemImage: "syringe",
                    description: Text("Yeni aşı kaydı eklemek için + butonuna tıklayın.")
                )
            } else {
                ForEach(viewModel.asilar) { asi in
                    asiKarti(asi)
                }
            }
        }
        .sheet(isPresented: $ekleGoster) {
            AsiEkleView { asiAdi, tarih, sonrakiTarih, vetAdi, not in
                viewModel.asiEkle(
                    asiAdi: asiAdi, tarih: tarih, sonrakiTarih: sonrakiTarih,
                    veterinerAdi: vetAdi, not: not
                )
            }
        }
    }

    private func asiKarti(_ asi: AsiKaydi) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "syringe.fill")
                .font(.title3)
                .foregroundStyle(.red)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 4) {
                Text(asi.asiAdi)
                    .fontWeight(.semibold)

                Text("Tarih: \(asi.tarih.turkceTarih)")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                if let sonraki = asi.sonrakiTarih {
                    Text("Sonraki: \(sonraki.turkceTarih)")
                        .font(.caption)
                        .foregroundStyle(sonraki < Date() ? .red : .blue)
                }

                if let vet = asi.veterinerAdi {
                    Text("Veteriner: \(vet)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            Button(role: .destructive) {
                viewModel.asiSil(asi)
            } label: {
                Image(systemName: "trash")
            }
            .buttonStyle(.plain)
            .foregroundStyle(.red)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.background)
                .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
        )
    }
}
