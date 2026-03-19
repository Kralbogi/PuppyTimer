import SwiftUI

struct YuruyusKaydiView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var baslik = "Sabah Yürüyüşü"
    @State private var saat = Date()
    @State private var sure = 30
    @State private var secilenGunler: Set<Int> = [1, 2, 3, 4, 5, 6, 7]

    var onKaydet: (String, Date, [Int], Int) -> Void

    private let gunler = [
        (1, "Pzt"), (2, "Sal"), (3, "Çar"), (4, "Per"),
        (5, "Cum"), (6, "Cmt"), (7, "Paz")
    ]

    var body: some View {
        VStack(spacing: 0) {
            Text("Yürüyüş Programı Ekle")
                .font(.title2)
                .fontWeight(.bold)
                .padding()

            Form {
                TextField("Başlık", text: $baslik)
                    .textFieldStyle(.roundedBorder)

                DatePicker("Saat", selection: $saat, displayedComponents: .hourAndMinute)

                Stepper("Süre: \(sure) dakika", value: $sure, in: 5...180, step: 5)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Günler")
                        .font(.headline)

                    HStack(spacing: 8) {
                        ForEach(gunler, id: \.0) { gun in
                            Button {
                                if secilenGunler.contains(gun.0) {
                                    secilenGunler.remove(gun.0)
                                } else {
                                    secilenGunler.insert(gun.0)
                                }
                            } label: {
                                Text(gun.1)
                                    .font(.caption)
                                    .frame(width: 36, height: 36)
                                    .background(
                                        Circle().fill(
                                            secilenGunler.contains(gun.0) ? Color.green : Color.secondary.opacity(0.2)
                                        )
                                    )
                                    .foregroundStyle(secilenGunler.contains(gun.0) ? .white : .primary)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
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
                    onKaydet(baslik, saat, Array(secilenGunler).sorted(), sure)
                    dismiss()
                }
                .keyboardShortcut(.defaultAction)
                .disabled(baslik.trimmingCharacters(in: .whitespaces).isEmpty || secilenGunler.isEmpty)
            }
            .padding()
        }
        .frame(width: 420, height: 450)
    }
}
