import SwiftUI

struct VeterinerZiyaretiView: View {
    var viewModel: SaglikViewModel
    @State private var ekleGoster = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Veteriner Ziyaretleri")
                    .font(.title2)
                    .fontWeight(.bold)
                Spacer()
                Button("Ziyaret Ekle", systemImage: "plus") {
                    ekleGoster = true
                }
            }

            if viewModel.ziyaretler.isEmpty {
                ContentUnavailableView(
                    "Henüz veteriner ziyareti yok",
                    systemImage: "stethoscope",
                    description: Text("Yeni ziyaret kaydı eklemek için + butonuna tıklayın.")
                )
            } else {
                ForEach(viewModel.ziyaretler) { ziyaret in
                    ziyaretKarti(ziyaret)
                }
            }
        }
        .sheet(isPresented: $ekleGoster) {
            VeterinerZiyaretEkleView { tarih, neden, teshis, tedavi, vetAdi, maliyet, not in
                viewModel.ziyaretEkle(
                    tarih: tarih, neden: neden, teshis: teshis, tedavi: tedavi,
                    veterinerAdi: vetAdi, maliyet: maliyet, not: not
                )
            }
        }
    }

    private func ziyaretKarti(_ ziyaret: VeterinerZiyareti) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "stethoscope")
                    .foregroundStyle(.green)
                Text(ziyaret.neden)
                    .fontWeight(.semibold)
                Spacer()
                Text(ziyaret.tarih.turkceTarih)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Button(role: .destructive) {
                    viewModel.ziyaretSil(ziyaret)
                } label: {
                    Image(systemName: "trash")
                }
                .buttonStyle(.plain)
                .foregroundStyle(.red)
            }

            if let teshis = ziyaret.teshis {
                Label("Teşhis: \(teshis)", systemImage: "doc.text")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if let tedavi = ziyaret.tedavi {
                Label("Tedavi: \(tedavi)", systemImage: "cross.case")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            HStack {
                if let vet = ziyaret.veterinerAdi {
                    Label(vet, systemImage: "person")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                if let maliyet = ziyaret.maliyet {
                    Text(String(format: "%.2f TL", maliyet))
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.orange)
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.background)
                .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
        )
    }
}

// MARK: - Veteriner Ziyaret Ekle View

struct VeterinerZiyaretEkleView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var tarih = Date()
    @State private var neden = ""
    @State private var teshis = ""
    @State private var tedavi = ""
    @State private var veterinerAdi = ""
    @State private var maliyetStr = ""
    @State private var not = ""

    var onKaydet: (Date, String, String?, String?, String?, Double?, String?) -> Void

    var body: some View {
        VStack(spacing: 0) {
            Text("Veteriner Ziyareti Ekle")
                .font(.title2)
                .fontWeight(.bold)
                .padding()

            Form {
                DatePicker("Tarih", selection: $tarih, displayedComponents: .date)

                TextField("Ziyaret Nedeni", text: $neden)
                    .textFieldStyle(.roundedBorder)

                TextField("Teşhis (isteğe bağlı)", text: $teshis)
                    .textFieldStyle(.roundedBorder)

                TextField("Tedavi (isteğe bağlı)", text: $tedavi)
                    .textFieldStyle(.roundedBorder)

                TextField("Veteriner Adı (isteğe bağlı)", text: $veterinerAdi)
                    .textFieldStyle(.roundedBorder)

                TextField("Maliyet TL (isteğe bağlı)", text: $maliyetStr)
                    .textFieldStyle(.roundedBorder)

                TextField("Not (isteğe bağlı)", text: $not)
                    .textFieldStyle(.roundedBorder)
            }
            .formStyle(.grouped)
            .scrollContentBackground(.hidden)

            HStack {
                Button("İptal") { dismiss() }
                    .keyboardShortcut(.cancelAction)
                Spacer()
                Button("Kaydet") {
                    onKaydet(
                        tarih,
                        neden,
                        teshis.isEmpty ? nil : teshis,
                        tedavi.isEmpty ? nil : tedavi,
                        veterinerAdi.isEmpty ? nil : veterinerAdi,
                        Double(maliyetStr),
                        not.isEmpty ? nil : not
                    )
                    dismiss()
                }
                .keyboardShortcut(.defaultAction)
                .disabled(neden.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding()
        }
        .frame(width: 420, height: 550)
    }
}
