import SwiftUI

struct MamaZamanlayiciView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var baslik = "Mama"
    @State private var saatAraligi = 8
    @State private var mamaMarkasi = ""
    @State private var miktar = ""

    var onKaydet: (String, Int, String?, String?) -> Void

    var body: some View {
        VStack(spacing: 0) {
            Text("Mama Programı Ekle")
                .font(.title2)
                .fontWeight(.bold)
                .padding()

            Form {
                TextField("Başlık", text: $baslik)
                    .textFieldStyle(.roundedBorder)

                Stepper("Saat Aralığı: \(saatAraligi) saat", value: $saatAraligi, in: 1...24)

                TextField("Mama Markası (isteğe bağlı)", text: $mamaMarkasi)
                    .textFieldStyle(.roundedBorder)

                TextField("Miktar (örn: 200g)", text: $miktar)
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
                    onKaydet(
                        baslik,
                        saatAraligi,
                        mamaMarkasi.isEmpty ? nil : mamaMarkasi,
                        miktar.isEmpty ? nil : miktar
                    )
                    dismiss()
                }
                .keyboardShortcut(.defaultAction)
                .disabled(baslik.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding()
        }
        .frame(width: 400, height: 350)
    }
}
