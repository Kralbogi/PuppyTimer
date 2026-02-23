import SwiftUI
import SwiftData

struct KucukTuvaletEkleView: View {
    let kopek: Kopek
    var onKaydet: (() -> Void)?

    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @State private var renk: IdrarRenk = .normal
    @State private var miktar: DiskilamaMiktar = .normal
    @State private var not = ""

    var body: some View {
        VStack(spacing: 0) {
            Text("Küçük Tuvalet Kaydı")
                .font(.title2)
                .fontWeight(.bold)
                .padding()

            Form {
                // Renk
                VStack(alignment: .leading, spacing: 8) {
                    Text("İdrar Rengi")
                        .font(.headline)

                    HStack(spacing: 12) {
                        ForEach(IdrarRenk.allCases, id: \.self) { r in
                            Button {
                                renk = r
                            } label: {
                                Text(r.baslik)
                                    .font(.caption)
                                    .frame(maxWidth: .infinity)
                                    .padding(8)
                                    .background(
                                        RoundedRectangle(cornerRadius: 8)
                                            .fill(renk == r ? idrarRenkDonustur(r).opacity(0.2) : Color.secondary.opacity(0.1))
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(renk == r ? idrarRenkDonustur(r) : Color.clear, lineWidth: 2)
                                    )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                // Uyari
                if renk.uyariMi {
                    HStack(spacing: 8) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundStyle(.red)
                        Text("Kırmızı idrar ciddi bir sağlık sorunu belirtisi olabilir. Hemen veterinere danışın!")
                            .font(.caption)
                            .foregroundStyle(.red)
                    }
                    .padding(12)
                    .background(RoundedRectangle(cornerRadius: 8).fill(.red.opacity(0.1)))
                }

                // Miktar
                Picker("Miktar", selection: $miktar) {
                    ForEach(DiskilamaMiktar.allCases, id: \.self) { m in
                        Text(m.baslik).tag(m)
                    }
                }
                .pickerStyle(.segmented)

                // Not
                TextField("Not (isteğe bağlı)", text: $not)
                    .textFieldStyle(.roundedBorder)
            }
            .formStyle(.grouped)
            .scrollContentBackground(.hidden)

            HStack {
                Button("İptal") { dismiss() }
                    .keyboardShortcut(.cancelAction)
                Spacer()
                Button("Kaydet") { kaydet() }
                    .keyboardShortcut(.defaultAction)
                    .buttonStyle(.borderedProminent)
                    .tint(.yellow)
            }
            .padding()
        }
        .frame(width: 420, height: 380)
    }

    private func kaydet() {
        let vm = TuvaletViewModel(modelContext: modelContext, kopek: kopek)
        _ = vm.kucukTuvaletEkle(
            renk: renk,
            miktar: miktar,
            not: not.isEmpty ? nil : not,
            enlem: nil, boylam: nil
        )
        onKaydet?()
        dismiss()
    }

    private func idrarRenkDonustur(_ r: IdrarRenk) -> Color {
        switch r {
        case .normal: return .yellow
        case .koyu: return .orange
        case .acik: return .yellow.opacity(0.5)
        case .kirmizi: return .red
        }
    }
}
