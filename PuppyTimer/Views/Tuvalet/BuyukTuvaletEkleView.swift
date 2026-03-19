import SwiftUI
import SwiftData
import PhotosUI

struct BuyukTuvaletEkleView: View {
    let kopek: Kopek
    var onKaydet: ((TuvaletKaydi) -> Void)?

    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @State private var sekil: DiskilamaSekli = .normal
    @State private var miktar: DiskilamaMiktar = .normal
    @State private var renk: DiskiRenk = .kahverengi
    @State private var kivam: DiskiKivam = .normal
    @State private var not = ""
    @State private var fotoData: Data?
    @State private var secilenFoto: PhotosPickerItem?

    // AI analiz
    @State private var analizYapiliyor = false
    @State private var analizSonucu: DiskiAnalizi?
    @State private var analizHatasi: String?

    var body: some View {
        VStack(spacing: 0) {
            Text("Büyük Tuvalet Kaydı")
                .font(.title2)
                .fontWeight(.bold)
                .padding()

            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Sekil
                    sekilSecici

                    // Miktar
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Miktar")
                            .font(.headline)
                        Picker("Miktar", selection: $miktar) {
                            ForEach(DiskilamaMiktar.allCases, id: \.self) { m in
                                Text(m.baslik).tag(m)
                            }
                        }
                        .pickerStyle(.segmented)
                    }

                    // Renk
                    renkSecici

                    // Kivam
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Kıvam")
                            .font(.headline)
                        Picker("Kıvam", selection: $kivam) {
                            ForEach(DiskiKivam.allCases, id: \.self) { k in
                                Text(k.baslik).tag(k)
                            }
                        }
                        .pickerStyle(.segmented)
                    }

                    // Uyari
                    if renk.uyariMi {
                        HStack(spacing: 8) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(.red)
                            Text(renk == .kirmizi
                                 ? "Kırmızı dışkı kanama belirtisi olabilir. Veterinere danışın!"
                                 : "Siyah dışkı sindirim sistemi kanaması belirtisi olabilir. Veterinere danışın!")
                                .font(.caption)
                                .foregroundStyle(.red)
                        }
                        .padding(12)
                        .background(RoundedRectangle(cornerRadius: 8).fill(.red.opacity(0.1)))
                    }

                    // Fotograf
                    fotoAlani

                    // AI Analiz
                    if fotoData != nil {
                        aiAnalizAlani
                    }

                    // Not
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Not (isteğe bağlı)")
                            .font(.headline)
                        TextField("Ek bilgi...", text: $not, axis: .vertical)
                            .textFieldStyle(.roundedBorder)
                            .lineLimit(3...5)
                    }
                }
                .padding(20)
            }

            // Butonlar
            HStack {
                Button("İptal") { dismiss() }
                    .keyboardShortcut(.cancelAction)
                Spacer()
                Button("Kaydet") { kaydet() }
                    .keyboardShortcut(.defaultAction)
                    .buttonStyle(.borderedProminent)
                    .tint(.brown)
            }
            .padding()
        }
        .frame(width: 500, height: 650)
        .onChange(of: secilenFoto) { _, yeni in
            Task {
                if let data = try? await yeni?.loadTransferable(type: Data.self) {
                    fotoData = data
                }
            }
        }
    }

    // MARK: - Sekil Secici

    private var sekilSecici: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Şekil")
                .font(.headline)

            HStack(spacing: 12) {
                ForEach(DiskilamaSekli.allCases, id: \.self) { s in
                    Button {
                        sekil = s
                    } label: {
                        VStack(spacing: 4) {
                            Image(systemName: s.ikon)
                                .font(.title3)
                            Text(s.baslik)
                                .font(.caption2)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(8)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(sekil == s ? Color.brown.opacity(0.2) : Color.secondary.opacity(0.1))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(sekil == s ? Color.brown : Color.clear, lineWidth: 2)
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // MARK: - Renk Secici

    private var renkSecici: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Renk")
                .font(.headline)

            LazyVGrid(columns: [
                GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())
            ], spacing: 8) {
                ForEach(DiskiRenk.allCases, id: \.self) { r in
                    Button {
                        renk = r
                    } label: {
                        HStack(spacing: 4) {
                            Circle()
                                .fill(renkDonustur(r))
                                .frame(width: 14, height: 14)
                            Text(r.baslik)
                                .font(.caption)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(8)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(renk == r ? renkDonustur(r).opacity(0.2) : Color.secondary.opacity(0.1))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(renk == r ? renkDonustur(r) : Color.clear, lineWidth: 2)
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // MARK: - Fotograf Alani

    private var fotoAlani: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Fotoğraf (isteğe bağlı)")
                .font(.headline)

            if let data = fotoData, let nsImage = NSImage(data: data) {
                ZStack(alignment: .topTrailing) {
                    Image(nsImage: nsImage)
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: 200)
                        .clipShape(RoundedRectangle(cornerRadius: 12))

                    Button {
                        fotoData = nil
                        secilenFoto = nil
                        analizSonucu = nil
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                    }
                    .buttonStyle(.plain)
                    .padding(4)
                }
            }

            PhotosPicker(selection: $secilenFoto, matching: .images) {
                Label(fotoData == nil ? "Fotoğraf Seç" : "Değiştir", systemImage: "photo")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
        }
    }

    // MARK: - AI Analiz

    private var aiAnalizAlani: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundStyle(.purple)
                Text("AI Sağlık Analizi")
                    .font(.headline)
            }

            if !AnahtarlikServisi.anahtarVarMi {
                HStack(spacing: 8) {
                    Image(systemName: "key.fill")
                        .foregroundStyle(.orange)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("API anahtarı gerekli")
                            .font(.caption)
                            .fontWeight(.medium)
                        Text("Ayarlar → Claude API bölümünden anahtarınızı ekleyin.")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(8)
                .background(RoundedRectangle(cornerRadius: 8).fill(.orange.opacity(0.1)))
            } else if analizYapiliyor {
                HStack {
                    ProgressView()
                        .scaleEffect(0.8)
                    Text("Analiz ediliyor...")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            } else if let sonuc = analizSonucu {
                TuvaletAnalizView(analiz: sonuc)
            } else {
                Button {
                    analizBaslat()
                } label: {
                    Label("AI ile Analiz Et", systemImage: "sparkles")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.purple)
            }

            if let hata = analizHatasi {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.circle.fill")
                        .foregroundStyle(.red)
                    Text(hata)
                        .font(.caption)
                }
                .foregroundStyle(.red)
                .padding(8)
                .background(RoundedRectangle(cornerRadius: 8).fill(.red.opacity(0.1)))
            }
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 12).fill(.purple.opacity(0.05)))
    }

    // MARK: - Aksiyonlar

    private func kaydet() {
        let vm = TuvaletViewModel(modelContext: modelContext, kopek: kopek)
        let kayit = vm.buyukTuvaletEkle(
            sekil: sekil, miktar: miktar, renk: renk, kivam: kivam,
            not: not.isEmpty ? nil : not,
            fotoData: fotoData,
            enlem: nil, boylam: nil
        )
        onKaydet?(kayit)
        dismiss()
    }

    private func analizBaslat() {
        guard let data = fotoData else { return }
        analizYapiliyor = true
        analizHatasi = nil

        Task {
            do {
                let sonuc = try await ClaudeAPIServisi.shared.diskiAnalizEt(fotoData: data)
                analizSonucu = sonuc
            } catch {
                analizHatasi = error.localizedDescription
            }
            analizYapiliyor = false
        }
    }

    private func renkDonustur(_ r: DiskiRenk) -> Color {
        switch r {
        case .kahverengi: return .brown
        case .koyu: return .gray
        case .acik: return .orange
        case .yesil: return .green
        case .kirmizi: return .red
        case .siyah: return .primary
        }
    }
}
