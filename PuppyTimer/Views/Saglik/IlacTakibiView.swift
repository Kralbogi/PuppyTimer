import SwiftUI

struct IlacTakibiView: View {
    var viewModel: SaglikViewModel
    @State private var ekleGoster = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("İlaç Takibi")
                    .font(.title2)
                    .fontWeight(.bold)
                Spacer()
                Button("İlaç Ekle", systemImage: "plus") {
                    ekleGoster = true
                }
            }

            if viewModel.ilaclar.isEmpty {
                ContentUnavailableView(
                    "Henüz ilaç kaydı yok",
                    systemImage: "pill",
                    description: Text("Yeni ilaç eklemek için + butonuna tıklayın.")
                )
            } else {
                ForEach(viewModel.ilaclar) { ilac in
                    ilacKarti(ilac)
                }
            }
        }
        .sheet(isPresented: $ekleGoster) {
            IlacEkleView { ilacAdi, doz, baslangic, bitis, saatAraligi, not in
                viewModel.ilacEkle(
                    ilacAdi: ilacAdi, doz: doz, baslangicTarihi: baslangic,
                    bitisTarihi: bitis, saatAraligi: saatAraligi, not: not
                )
            }
        }
    }

    private func ilacKarti(_ ilac: IlacTakibi) -> some View {
        HStack(spacing: 12) {
            Image(systemName: ilac.aktif ? "pill.fill" : "pill")
                .font(.title3)
                .foregroundStyle(ilac.aktif ? .blue : .secondary)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(ilac.ilacAdi)
                        .fontWeight(.semibold)
                    if !ilac.aktif {
                        Text("(Bitti)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Text("Doz: \(ilac.doz) - Her \(ilac.saatAraligi) saatte")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                if let sonDoz = ilac.sonDoz {
                    Text("Son doz: \(sonDoz.turkceTarihSaat)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                if ilac.aktif, let sonraki = ilac.birSonrakiDoz {
                    Text("Sonraki: \(sonraki.turkceSaat)")
                        .font(.caption)
                        .foregroundStyle(.blue)
                        .fontWeight(.medium)
                }
            }

            Spacer()

            if ilac.aktif {
                Button("Doz Verildi") {
                    viewModel.ilacDozVerildi(ilac)
                }
                .buttonStyle(.borderedProminent)
                .tint(.blue)
                .controlSize(.small)
            }

            Button(role: .destructive) {
                viewModel.ilacSil(ilac)
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

// MARK: - Ilac Ekle View

struct IlacEkleView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var ilacAdi = ""
    @State private var doz = ""
    @State private var baslangicTarihi = Date()
    @State private var bitisTarihiVar = false
    @State private var bitisTarihi = Date().addingTimeInterval(30 * 24 * 3600)
    @State private var saatAraligi = 8
    @State private var not = ""

    var onKaydet: (String, String, Date, Date?, Int, String?) -> Void

    var body: some View {
        VStack(spacing: 0) {
            Text("İlaç Ekle")
                .font(.title2)
                .fontWeight(.bold)
                .padding()

            Form {
                TextField("İlaç Adı", text: $ilacAdi)
                    .textFieldStyle(.roundedBorder)

                TextField("Doz (örn: 1 tablet)", text: $doz)
                    .textFieldStyle(.roundedBorder)

                DatePicker("Başlangıç Tarihi", selection: $baslangicTarihi, displayedComponents: .date)

                Toggle("Bitiş tarihi ekle", isOn: $bitisTarihiVar)

                if bitisTarihiVar {
                    DatePicker("Bitiş Tarihi", selection: $bitisTarihi, displayedComponents: .date)
                }

                Stepper("Her \(saatAraligi) saatte bir", value: $saatAraligi, in: 1...48)

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
                        ilacAdi, doz, baslangicTarihi,
                        bitisTarihiVar ? bitisTarihi : nil,
                        saatAraligi,
                        not.isEmpty ? nil : not
                    )
                    dismiss()
                }
                .keyboardShortcut(.defaultAction)
                .disabled(ilacAdi.trimmingCharacters(in: .whitespaces).isEmpty ||
                          doz.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding()
        }
        .frame(width: 420, height: 500)
    }
}
