import SwiftUI

struct SaglikNotuView: View {
    var viewModel: SaglikViewModel
    @State private var ekleGoster = false
    @State private var secilenKategori: SaglikKategorisi?

    var filtrelenmisNotlar: [SaglikNotu] {
        if let kategori = secilenKategori {
            return viewModel.notlar.filter { $0.kategori == kategori }
        }
        return viewModel.notlar
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Sağlık Notları")
                    .font(.title2)
                    .fontWeight(.bold)
                Spacer()
                Button("Not Ekle", systemImage: "plus") {
                    ekleGoster = true
                }
            }

            // Kategori filtresi
            HStack(spacing: 8) {
                kategoriFiltreButon(nil, metin: "Tümü")
                ForEach(SaglikKategorisi.allCases, id: \.self) { kategori in
                    kategoriFiltreButon(kategori, metin: kategori.baslik)
                }
            }

            if filtrelenmisNotlar.isEmpty {
                ContentUnavailableView(
                    "Henüz sağlık notu yok",
                    systemImage: "note.text",
                    description: Text("Yeni not eklemek için + butonuna tıklayın.")
                )
            } else {
                ForEach(filtrelenmisNotlar) { not in
                    notKarti(not)
                }
            }
        }
        .sheet(isPresented: $ekleGoster) {
            SaglikNotuEkleView { baslik, icerik, kategori in
                viewModel.notEkle(baslik: baslik, icerik: icerik, kategori: kategori)
            }
        }
    }

    private func kategoriFiltreButon(_ kategori: SaglikKategorisi?, metin: String) -> some View {
        Button(metin) {
            secilenKategori = kategori
        }
        .buttonStyle(.bordered)
        .tint(secilenKategori == kategori ? .blue : .secondary)
        .controlSize(.small)
    }

    private func notKarti(_ not: SaglikNotu) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(not.kategori.baslik)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(Capsule().fill(.blue.opacity(0.2)))

                Spacer()

                Text(not.tarih.turkceTarih)
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Button(role: .destructive) {
                    viewModel.notSil(not)
                } label: {
                    Image(systemName: "trash")
                }
                .buttonStyle(.plain)
                .foregroundStyle(.red)
            }

            Text(not.baslik)
                .fontWeight(.semibold)

            Text(not.icerik)
                .font(.body)
                .foregroundStyle(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.background)
                .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
        )
    }
}

// MARK: - Not Ekle View

struct SaglikNotuEkleView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var baslik = ""
    @State private var icerik = ""
    @State private var kategori: SaglikKategorisi = .genel

    var onKaydet: (String, String, SaglikKategorisi) -> Void

    var body: some View {
        VStack(spacing: 0) {
            Text("Sağlık Notu Ekle")
                .font(.title2)
                .fontWeight(.bold)
                .padding()

            Form {
                TextField("Başlık", text: $baslik)
                    .textFieldStyle(.roundedBorder)

                Picker("Kategori", selection: $kategori) {
                    ForEach(SaglikKategorisi.allCases, id: \.self) { k in
                        Text(k.baslik).tag(k)
                    }
                }

                TextEditor(text: $icerik)
                    .frame(minHeight: 100)
                    .border(.secondary.opacity(0.3))
            }
            .formStyle(.grouped)
            .scrollContentBackground(.hidden)

            HStack {
                Button("İptal") { dismiss() }
                    .keyboardShortcut(.cancelAction)
                Spacer()
                Button("Kaydet") {
                    onKaydet(baslik, icerik, kategori)
                    dismiss()
                }
                .keyboardShortcut(.defaultAction)
                .disabled(baslik.trimmingCharacters(in: .whitespaces).isEmpty ||
                          icerik.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding()
        }
        .frame(width: 420, height: 400)
    }
}
