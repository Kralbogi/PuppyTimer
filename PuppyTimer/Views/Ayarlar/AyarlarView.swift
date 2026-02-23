import SwiftUI

struct AyarlarView: View {
    @State private var apiKey = ""
    @State private var kaydedildi = false
    @State private var anahtarVar = AnahtarlikServisi.anahtarVarMi
    @State private var hata: String?
    @State private var testYapiliyor = false
    @State private var testSonucu: String?

    var body: some View {
        Form {
            Section("Claude API Anahtarı") {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Image(systemName: anahtarVar ? "checkmark.circle.fill" : "xmark.circle")
                            .foregroundStyle(anahtarVar ? .green : .red)
                        Text(anahtarVar ? "API anahtarı kayıtlı" : "API anahtarı kayıtlı değil")
                            .font(.subheadline)
                    }

                    SecureField("API Anahtarı (sk-ant-...)", text: $apiKey)
                        .textFieldStyle(.roundedBorder)

                    HStack(spacing: 12) {
                        Button("Kaydet") {
                            kaydet()
                        }
                        .disabled(apiKey.trimmingCharacters(in: .whitespaces).isEmpty)

                        if anahtarVar {
                            Button("Test Et") {
                                testEt()
                            }
                            .disabled(testYapiliyor)

                            Button("Sil", role: .destructive) {
                                sil()
                            }
                        }
                    }

                    if kaydedildi {
                        Text("API anahtarı başarıyla kaydedildi.")
                            .font(.caption)
                            .foregroundStyle(.green)
                    }

                    if let hata = hata {
                        Text(hata)
                            .font(.caption)
                            .foregroundStyle(.red)
                    }

                    if testYapiliyor {
                        HStack {
                            ProgressView()
                                .scaleEffect(0.7)
                            Text("Test ediliyor...")
                                .font(.caption)
                        }
                    }

                    if let sonuc = testSonucu {
                        Text(sonuc)
                            .font(.caption)
                            .foregroundStyle(.blue)
                    }
                }
            }

            Section("Hakkında") {
                VStack(alignment: .leading, spacing: 8) {
                    Text("PuppyTimer")
                        .font(.headline)
                    Text("Köpek bakım ve sağlık takip uygulaması")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("Claude API, köpek fotoğrafı analizi ve dışkı sağlık değerlendirmesi için kullanılır.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .formStyle(.grouped)
        .frame(width: 450, height: 350)
    }

    private func kaydet() {
        do {
            try AnahtarlikServisi.kaydet(apiKey.trimmingCharacters(in: .whitespaces))
            anahtarVar = true
            kaydedildi = true
            hata = nil
            apiKey = ""

            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                kaydedildi = false
            }
        } catch {
            self.hata = error.localizedDescription
        }
    }

    private func sil() {
        do {
            try AnahtarlikServisi.sil()
            anahtarVar = false
            hata = nil
            testSonucu = nil
        } catch {
            self.hata = error.localizedDescription
        }
    }

    private func testEt() {
        testYapiliyor = true
        testSonucu = nil
        hata = nil

        Task {
            do {
                // Basit bir test: küçük bir metin göndererek API'nin çalıştığını doğrula
                guard let key = AnahtarlikServisi.getir() else {
                    hata = "API anahtarı bulunamadı."
                    testYapiliyor = false
                    return
                }

                guard let url = URL(string: "https://api.anthropic.com/v1/messages") else { return }

                var request = URLRequest(url: url)
                request.httpMethod = "POST"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.setValue(key, forHTTPHeaderField: "x-api-key")
                request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")

                let body: [String: Any] = [
                    "model": "claude-sonnet-4-5-20250929",
                    "max_tokens": 10,
                    "messages": [["role": "user", "content": "test"]]
                ]
                request.httpBody = try JSONSerialization.data(withJSONObject: body)

                let (_, response) = try await URLSession.shared.data(for: request)

                if let http = response as? HTTPURLResponse, http.statusCode == 200 {
                    testSonucu = "Bağlantı başarılı! API anahtarı geçerli."
                } else {
                    hata = "API yanıt vermedi. Anahtarı kontrol edin."
                }
            } catch {
                self.hata = "Bağlantı hatası: \(error.localizedDescription)"
            }
            testYapiliyor = false
        }
    }
}
