import SwiftUI

struct AsiEkleView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var asiAdi = ""
    @State private var tarih = Date()
    @State private var sonrakiTarihVar = false
    @State private var sonrakiTarih = Date().addingTimeInterval(365 * 24 * 3600)
    @State private var veterinerAdi = ""
    @State private var not = ""

    var onKaydet: (String, Date, Date?, String?, String?) -> Void

    var body: some View {
        VStack(spacing: 0) {
            Text("Aşı Kaydı Ekle")
                .font(.title2)
                .fontWeight(.bold)
                .padding()

            Form {
                TextField("Aşı Adı", text: $asiAdi)
                    .textFieldStyle(.roundedBorder)

                DatePicker("Tarih", selection: $tarih, displayedComponents: .date)

                Toggle("Sonraki tarih ekle", isOn: $sonrakiTarihVar)

                if sonrakiTarihVar {
                    DatePicker("Sonraki Aşı Tarihi", selection: $sonrakiTarih, displayedComponents: .date)
                }

                TextField("Veteriner Adı (isteğe bağlı)", text: $veterinerAdi)
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
                        asiAdi,
                        tarih,
                        sonrakiTarihVar ? sonrakiTarih : nil,
                        veterinerAdi.isEmpty ? nil : veterinerAdi,
                        not.isEmpty ? nil : not
                    )
                    dismiss()
                }
                .keyboardShortcut(.defaultAction)
                .disabled(asiAdi.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding()
        }
        .frame(width: 420, height: 450)
    }
}
