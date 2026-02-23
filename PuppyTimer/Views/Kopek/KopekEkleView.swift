import SwiftUI
import SwiftData

struct KopekEkleView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @State private var ad = ""
    @State private var irk = ""
    @State private var cinsiyet: Cinsiyet = .erkek
    @State private var dogumTarihi = Date()
    @State private var dogumTarihiVar = false
    @State private var agirlik = ""

    var onKaydet: ((Kopek) -> Void)?

    var body: some View {
        VStack(spacing: 0) {
            Text("Yeni Köpek Ekle")
                .font(.title2)
                .fontWeight(.bold)
                .padding()

            Form {
                TextField("Ad", text: $ad)
                    .textFieldStyle(.roundedBorder)

                TextField("Irk", text: $irk)
                    .textFieldStyle(.roundedBorder)

                Picker("Cinsiyet", selection: $cinsiyet) {
                    ForEach(Cinsiyet.allCases, id: \.self) { c in
                        Text(c.baslik).tag(c)
                    }
                }
                .pickerStyle(.segmented)

                Toggle("Doğum tarihi ekle", isOn: $dogumTarihiVar)

                if dogumTarihiVar {
                    DatePicker("Doğum Tarihi", selection: $dogumTarihi, displayedComponents: .date)
                }

                TextField("Ağırlık (kg)", text: $agirlik)
                    .textFieldStyle(.roundedBorder)
            }
            .formStyle(.grouped)
            .scrollContentBackground(.hidden)

            HStack {
                Button("İptal") {
                    dismiss()
                }
                .keyboardShortcut(.cancelAction)

                Spacer()

                Button("Kaydet") {
                    kaydet()
                }
                .keyboardShortcut(.defaultAction)
                .disabled(ad.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding()
        }
        .frame(width: 400, height: 400)
    }

    private func kaydet() {
        let yeniKopek = Kopek(
            ad: ad.trimmingCharacters(in: .whitespaces),
            irk: irk.trimmingCharacters(in: .whitespaces),
            cinsiyet: cinsiyet
        )

        if dogumTarihiVar {
            yeniKopek.dogumTarihi = dogumTarihi
        }

        if let kg = Double(agirlik) {
            yeniKopek.agirlik = kg
        }

        modelContext.insert(yeniKopek)
        try? modelContext.save()
        onKaydet?(yeniKopek)
        dismiss()
    }
}
