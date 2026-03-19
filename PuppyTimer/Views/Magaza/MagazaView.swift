// =============================================================================
// PawLand macOS — MagazaView
// Firestore'dan ürün listesi çeker, sepete ekler, sipariş oluşturur
// =============================================================================

import SwiftUI

struct Urun: Identifiable {
    let id: String
    let ad: String
    let aciklama: String
    let fiyat: Double
    let resimUrl: String
    let stok: Int
    let kategori: String
}

struct SepetOge: Identifiable {
    let id = UUID()
    let urun: Urun
    var adet: Int
}

@MainActor
class MagazaViewModel: ObservableObject {
    @Published var urunler: [Urun] = []
    @Published var sepet: [SepetOge] = []
    @Published var yukleniyor = true
    @Published var siparisVeriliyor = false
    @Published var siparisBasarili = false
    @Published var hata: String?
    @Published var aramaMetni = ""
    @Published var secilenKategori: String? = nil

    private let firestoreServisi = FirestoreServisi.shared

    var filtreliUrunler: [Urun] {
        urunler.filter { urun in
            let kategoriBas = secilenKategori == nil || urun.kategori == secilenKategori
            let aramaBas = aramaMetni.isEmpty ||
                urun.ad.localizedCaseInsensitiveContains(aramaMetni) ||
                urun.aciklama.localizedCaseInsensitiveContains(aramaMetni)
            return kategoriBas && aramaBas
        }
    }

    var kategoriler: [String] {
        Array(Set(urunler.map(\.kategori))).sorted()
    }

    var toplamFiyat: Double {
        sepet.reduce(0) { $0 + ($1.urun.fiyat * Double($1.adet)) }
    }

    var sepetAdedi: Int {
        sepet.reduce(0) { $0 + $1.adet }
    }

    func urunleriYukle() async {
        yukleniyor = true
        let veriler = await firestoreServisi.aktifUrunleriGetir()
        urunler = veriler.compactMap { veri -> Urun? in
            guard
                let id  = veri["id"]  as? String,
                let ad  = veri["ad"]  as? String,
                let fiy = veri["fiyat"] as? Double
            else { return nil }
            return Urun(
                id: id,
                ad: ad,
                aciklama: veri["aciklama"] as? String ?? "",
                fiyat: fiy,
                resimUrl: veri["resimUrl"] as? String ?? "",
                stok: veri["stok"] as? Int ?? 0,
                kategori: veri["kategori"] as? String ?? "Diğer"
            )
        }
        yukleniyor = false
    }

    func sepeteEkle(_ urun: Urun) {
        if let idx = sepet.firstIndex(where: { $0.urun.id == urun.id }) {
            sepet[idx].adet += 1
        } else {
            sepet.append(SepetOge(urun: urun, adet: 1))
        }
    }

    func sepettenCikar(urunId: String) {
        sepet.removeAll { $0.urun.id == urunId }
    }

    func siparisVer(teslimatAdresi: String) async {
        guard !sepet.isEmpty else { return }
        siparisVeriliyor = true
        hata = nil

        let urunVerileri: [[String: Any]] = sepet.map { oge in
            ["urunId": oge.urun.id, "ad": oge.urun.ad, "adet": oge.adet, "fiyat": oge.urun.fiyat]
        }

        do {
            try await firestoreServisi.siparisOlustur(
                urunler: urunVerileri,
                teslimatAdresi: teslimatAdresi
            )
            sepet.removeAll()
            siparisBasarili = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                self.siparisBasarili = false
            }
        } catch {
            hata = error.localizedDescription
        }
        siparisVeriliyor = false
    }
}

struct MagazaView: View {
    @StateObject private var vm = MagazaViewModel()
    @State private var sepetAcik = false
    @State private var teslimatAdresi = ""

    var body: some View {
        NavigationSplitView {
            // ── Kenar çubuğu: kategoriler ─────────────────────────────────
            List(selection: $vm.secilenKategori) {
                Label("Tümü", systemImage: "square.grid.2x2")
                    .tag(nil as String?)

                Section("Kategoriler") {
                    ForEach(vm.kategoriler, id: \.self) { kategori in
                        Label(kategori, systemImage: "tag")
                            .tag(kategori as String?)
                    }
                }
            }
            .navigationTitle("Mağaza")
            .toolbar {
                ToolbarItem {
                    Button {
                        sepetAcik = true
                    } label: {
                        ZStack(alignment: .topTrailing) {
                            Image(systemName: "cart")
                            if vm.sepetAdedi > 0 {
                                Text("\(vm.sepetAdedi)")
                                    .font(.caption2.weight(.bold))
                                    .foregroundStyle(.white)
                                    .frame(width: 16, height: 16)
                                    .background(Color.orange)
                                    .clipShape(Circle())
                                    .offset(x: 8, y: -8)
                            }
                        }
                    }
                }
            }
        } detail: {
            if vm.yukleniyor {
                ProgressView("Ürünler yükleniyor...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if vm.filtreliUrunler.isEmpty {
                ContentUnavailableView(
                    "Ürün Bulunamadı",
                    systemImage: "magnifyingglass",
                    description: Text("Farklı bir arama deneyin")
                )
            } else {
                ScrollView {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 200, maximum: 280))], spacing: 16) {
                        ForEach(vm.filtreliUrunler) { urun in
                            UrunKartiMac(urun: urun) {
                                vm.sepeteEkle(urun)
                            }
                        }
                    }
                    .padding()
                }
                .searchable(text: $vm.aramaMetni, prompt: "Ürün ara...")
            }
        }
        .sheet(isPresented: $sepetAcik) {
            SepetSheet(vm: vm, teslimatAdresi: $teslimatAdresi)
        }
        .task {
            await FirestoreServisi.shared.anonimGirisYap()
            await vm.urunleriYukle()
        }
    }
}

// MARK: - Ürün kartı

struct UrunKartiMac: View {
    let urun: Urun
    let onEkle: () -> Void
    @State private var hoverAktif = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Resim placeholder (AsyncImage ile gerçek URL yüklenebilir)
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.orange.opacity(0.1))
                    .frame(height: 140)
                Image(systemName: "photo")
                    .font(.largeTitle)
                    .foregroundStyle(.orange.opacity(0.4))
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(urun.ad)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(2)

                Text(urun.aciklama)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)

                HStack {
                    Text("₺\(urun.fiyat, specifier: "%.2f")")
                        .font(.headline)
                        .foregroundStyle(.orange)
                    Spacer()
                    Text("Stok: \(urun.stok)")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
            }
            .padding(.horizontal, 4)

            Button(action: onEkle) {
                Label("Sepete Ekle", systemImage: "cart.badge.plus")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(.orange)
            .disabled(urun.stok <= 0)
            .controlSize(.small)
        }
        .padding(12)
        .background(Color(nsColor: .controlBackgroundColor))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(hoverAktif ? 0.1 : 0.04), radius: hoverAktif ? 8 : 3)
        .scaleEffect(hoverAktif ? 1.02 : 1.0)
        .animation(.easeInOut(duration: 0.15), value: hoverAktif)
        .onHover { hoverAktif = $0 }
    }
}

// MARK: - Sepet sheet

struct SepetSheet: View {
    @ObservedObject var vm: MagazaViewModel
    @Binding var teslimatAdresi: String
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Sepetim")
                    .font(.headline)
                Spacer()
                Button { dismiss() } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }
            .padding()

            Divider()

            if vm.sepet.isEmpty {
                VStack(spacing: 10) {
                    Image(systemName: "cart")
                        .font(.largeTitle)
                        .foregroundStyle(.tertiary)
                    Text("Sepetiniz boş")
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List {
                    ForEach(vm.sepet) { oge in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(oge.urun.ad).font(.subheadline.weight(.medium))
                                Text("₺\(oge.urun.fiyat * Double(oge.adet), specifier: "%.2f")")
                                    .font(.caption).foregroundStyle(.orange)
                            }
                            Spacer()
                            Text("x\(oge.adet)").font(.caption).foregroundStyle(.secondary)
                            Button(role: .destructive) {
                                vm.sepettenCikar(urunId: oge.urun.id)
                            } label: {
                                Image(systemName: "trash")
                            }
                            .buttonStyle(.plain)
                            .foregroundStyle(.red)
                        }
                    }
                }

                Divider()

                VStack(spacing: 12) {
                    HStack {
                        Text("Toplam:")
                            .font(.headline)
                        Spacer()
                        Text("₺\(vm.toplamFiyat, specifier: "%.2f")")
                            .font(.headline)
                            .foregroundStyle(.orange)
                    }

                    TextField("Teslimat adresi...", text: $teslimatAdresi, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(2...4)

                    if let hata = vm.hata {
                        Text(hata).font(.caption).foregroundStyle(.red)
                    }

                    if vm.siparisBasarili {
                        Label("Sipariş oluşturuldu!", systemImage: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                            .font(.subheadline)
                    }

                    Button {
                        Task { await vm.siparisVer(teslimatAdresi: teslimatAdresi) }
                    } label: {
                        if vm.siparisVeriliyor {
                            ProgressView().scaleEffect(0.8)
                        } else {
                            Text("Siparişi Tamamla")
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.orange)
                    .disabled(vm.siparisVeriliyor || vm.sepet.isEmpty)
                }
                .padding()
            }
        }
        .frame(width: 380, height: 500)
    }
}
