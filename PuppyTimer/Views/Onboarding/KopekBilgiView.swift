import SwiftUI

struct KopekBilgiOnboardingView: View {
    @Bindable var viewModel: OnboardingViewModel

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Text("Köpeğinizin Bilgileri")
                .font(.title)
                .fontWeight(.bold)

            Text("Köpeğinizin temel bilgilerini girin.")
                .foregroundStyle(.secondary)

            Form {
                TextField("Köpek Adı", text: $viewModel.kopekAdi)
                    .textFieldStyle(.roundedBorder)

                TextField("Irk", text: $viewModel.kopekIrk)
                    .textFieldStyle(.roundedBorder)

                Picker("Cinsiyet", selection: $viewModel.cinsiyet) {
                    ForEach(Cinsiyet.allCases, id: \.self) { c in
                        Text(c.baslik).tag(c)
                    }
                }
                .pickerStyle(.segmented)

                Toggle("Doğum tarihini biliyorum", isOn: $viewModel.dogumTarihiVar)

                if viewModel.dogumTarihiVar {
                    DatePicker(
                        "Doğum Tarihi",
                        selection: $viewModel.dogumTarihi,
                        in: ...Date(),
                        displayedComponents: .date
                    )
                }

                TextField("Ağırlık (kg)", text: $viewModel.agirlikStr)
                    .textFieldStyle(.roundedBorder)
            }
            .formStyle(.grouped)
            .scrollContentBackground(.hidden)
            .frame(maxWidth: 400)

            Spacer()

            // Navigasyon
            HStack {
                Button("Geri") {
                    viewModel.geri()
                }

                Spacer()

                Button("Devam") {
                    viewModel.ileri()
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
                .disabled(viewModel.kopekAdi.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
        }
        .padding(20)
    }
}
