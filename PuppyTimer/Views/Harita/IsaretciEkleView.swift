import SwiftUI
import MapKit

struct IsaretciEkleView: View {
    let koordinat: CLLocationCoordinate2D
    var onKaydet: (String, IsaretciTuru, String?) -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var baslik = ""
    @State private var tur: IsaretciTuru = .diger
    @State private var not = ""

    var body: some View {
        VStack(spacing: 0) {
            Text("İşaretçi Ekle")
                .font(.title2)
                .fontWeight(.bold)
                .padding()

            // Mini harita
            Map {
                Annotation("Yeni İşaretçi", coordinate: koordinat) {
                    ZStack {
                        Circle()
                            .fill(.blue)
                            .frame(width: 24, height: 24)
                        Image(systemName: "plus")
                            .font(.caption)
                            .foregroundStyle(.white)
                    }
                }
            }
            .frame(height: 120)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .padding(.horizontal, 20)
            .allowsHitTesting(false)

            // Konum bilgisi
            Text(String(format: "%.5f, %.5f", koordinat.latitude, koordinat.longitude))
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.top, 4)

            Form {
                TextField("Başlık", text: $baslik)
                    .textFieldStyle(.roundedBorder)

                Picker("Tür", selection: $tur) {
                    ForEach(IsaretciTuru.allCases, id: \.self) { t in
                        Label(t.baslik, systemImage: t.ikon).tag(t)
                    }
                }

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
                    onKaydet(baslik, tur, not.isEmpty ? nil : not)
                    dismiss()
                }
                .keyboardShortcut(.defaultAction)
                .disabled(baslik.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding()
        }
        .frame(width: 400, height: 480)
    }
}
