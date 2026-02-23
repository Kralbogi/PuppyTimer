import SwiftUI

struct SuZamanlayiciView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var saatAraligi = 4

    var onKaydet: (Int) -> Void

    var body: some View {
        VStack(spacing: 0) {
            Text("Su Programı Ekle")
                .font(.title2)
                .fontWeight(.bold)
                .padding()

            Form {
                Stepper("Saat Aralığı: \(saatAraligi) saat", value: $saatAraligi, in: 1...24)

                Text("Köpeğinize her \(saatAraligi) saatte bir su vermeniz hatırlatılacak.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
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
                    onKaydet(saatAraligi)
                    dismiss()
                }
                .keyboardShortcut(.defaultAction)
            }
            .padding()
        }
        .frame(width: 350, height: 250)
    }
}
