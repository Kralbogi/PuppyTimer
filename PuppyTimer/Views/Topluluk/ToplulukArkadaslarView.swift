// =============================================================================
// PawLand macOS — ToplulukArkadaslarView
// Arkadaş listesi, istek gönder/kabul et
// =============================================================================

import SwiftUI
import FirebaseFirestore
import FirebaseAuth

struct Arkadas: Identifiable {
    let id: String
    let rumuz: String
    let durum: ArkadasDurum

    enum ArkadasDurum {
        case kabul, beklemede, gelen
    }
}

@MainActor
class ToplulukArkadaslarViewModel: ObservableObject {
    @Published var arkadaslar: [Arkadas] = []
    @Published var bekleyenler: [Arkadas] = []
    @Published var yukleniyor = true
    @Published var aramaMetni = ""

    private let db = Firestore.firestore()

    var kullaniciId: String { Auth.auth().currentUser?.uid ?? "" }

    func yukle() {
        guard !kullaniciId.isEmpty else { return }
        yukleniyor = true

        db.collection("arkadasliklar")
            .whereFilter(Filter.orFilter([
                Filter.whereField("uid1", isEqualTo: kullaniciId),
                Filter.whereField("uid2", isEqualTo: kullaniciId)
            ]))
            .addSnapshotListener { [weak self] snapshot, _ in
                guard let self, let docs = snapshot?.documents else { return }

                var arkadasListesi: [Arkadas] = []
                var bekleyenListesi: [Arkadas] = []

                for doc in docs {
                    let veri = doc.data()
                    let uid1   = veri["uid1"]   as? String ?? ""
                    let uid2   = veri["uid2"]   as? String ?? ""
                    let rumuz1 = veri["rumuz1"] as? String ?? "Anonim"
                    let rumuz2 = veri["rumuz2"] as? String ?? "Anonim"
                    let durum  = veri["durum"]  as? String ?? ""

                    let diger = uid1 == self.kullaniciId ? uid2 : uid1
                    let digerRumuz = uid1 == self.kullaniciId ? rumuz2 : rumuz1
                    let gonderen = veri["gonderId"] as? String ?? ""

                    switch durum {
                    case "kabul":
                        arkadasListesi.append(Arkadas(id: diger, rumuz: digerRumuz, durum: .kabul))
                    case "beklemede":
                        if gonderen == self.kullaniciId {
                            arkadasListesi.append(Arkadas(id: diger, rumuz: "\(digerRumuz) (Bekliyor)", durum: .beklemede))
                        } else {
                            bekleyenListesi.append(Arkadas(id: diger, rumuz: digerRumuz, durum: .gelen))
                        }
                    default: break
                    }
                }

                self.arkadaslar = arkadasListesi
                self.bekleyenler = bekleyenListesi
                self.yukleniyor = false
            }
    }

    func istekKabul(arkadasId: String) {
        let docId = ([kullaniciId, arkadasId].sorted()).joined(separator: "_")
        db.collection("arkadasliklar").document(docId)
            .updateData(["durum": "kabul"])
    }

    func istekReddet(arkadasId: String) {
        let docId = ([kullaniciId, arkadasId].sorted()).joined(separator: "_")
        db.collection("arkadasliklar").document(docId).delete()
    }

    func arkadasSil(arkadasId: String) {
        let docId = ([kullaniciId, arkadasId].sorted()).joined(separator: "_")
        db.collection("arkadasliklar").document(docId).delete()
    }

    func istekGonder(hedefRumuz: String) async throws {
        // Rumuz ile kullanıcı ara
        let snapshot = try await db.collection("kullanicilar")
            .whereField("rumuz", isEqualTo: hedefRumuz)
            .limit(to: 1)
            .getDocuments()

        guard let hedefDoc = snapshot.documents.first else {
            throw NSError(domain: "", code: 0, userInfo: [NSLocalizedDescriptionKey: "Kullanıcı bulunamadı"])
        }

        let hedefId = hedefDoc.documentID
        let mevcutRumuz = UserDefaults.standard.string(forKey: "rumuz") ?? "Anonim"
        let docId = ([kullaniciId, hedefId].sorted()).joined(separator: "_")

        let veri: [String: Any] = [
            "uid1": kullaniciId,
            "uid2": hedefId,
            "rumuz1": mevcutRumuz,
            "rumuz2": hedefDoc.data()["rumuz"] as? String ?? "Anonim",
            "durum": "beklemede",
            "gonderId": kullaniciId,
            "tarih": FieldValue.serverTimestamp(),
        ]
        try await db.collection("arkadasliklar").document(docId).setData(veri)
    }
}

struct ToplulukArkadaslarView: View {
    @StateObject private var vm = ToplulukArkadaslarViewModel()
    @State private var istekRumuz = ""
    @State private var istekGonderiyor = false
    @State private var istekHata: String?
    @State private var istekBasarili = false

    var body: some View {
        VStack(spacing: 0) {
            // ── İstek gönder ─────────────────────────────────────────────
            VStack(alignment: .leading, spacing: 8) {
                Text("Arkadaş Ekle")
                    .font(.headline)
                    .padding(.horizontal)
                    .padding(.top, 12)

                HStack {
                    Image(systemName: "at")
                        .foregroundStyle(.secondary)
                        .font(.subheadline)
                    TextField("Rumuz ile ara...", text: $istekRumuz)
                        .textFieldStyle(.plain)
                    Button("Gönder") {
                        Task { await istekGonder() }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.orange)
                    .disabled(istekRumuz.trimmingCharacters(in: .whitespaces).isEmpty || istekGonderiyor)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(nsColor: .controlBackgroundColor))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .padding(.horizontal)

                if let hata = istekHata {
                    Text(hata).font(.caption).foregroundStyle(.red).padding(.horizontal)
                }
                if istekBasarili {
                    Text("Arkadaşlık isteği gönderildi!").font(.caption).foregroundStyle(.green).padding(.horizontal)
                }
            }
            .padding(.bottom, 8)

            Divider()

            // ── Gelen istekler ────────────────────────────────────────────
            if !vm.bekleyenler.isEmpty {
                VStack(alignment: .leading, spacing: 0) {
                    Text("Gelen İstekler (\(vm.bekleyenler.count))")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)

                    ForEach(vm.bekleyenler) { arkadas in
                        HStack {
                            Image(systemName: "person.circle.fill")
                                .foregroundStyle(.orange)
                            Text("@\(arkadas.rumuz)")
                                .font(.subheadline)
                            Spacer()
                            Button("Kabul") {
                                vm.istekKabul(arkadasId: arkadas.id)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.green)
                            .controlSize(.small)
                            Button("Reddet", role: .destructive) {
                                vm.istekReddet(arkadasId: arkadas.id)
                            }
                            .buttonStyle(.bordered)
                            .controlSize(.small)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 6)
                    }
                }
                .background(Color.orange.opacity(0.05))

                Divider()
            }

            // ── Arkadaş listesi ───────────────────────────────────────────
            if vm.yukleniyor {
                HStack { Spacer(); ProgressView("Yükleniyor..."); Spacer() }.padding()
            } else if vm.arkadaslar.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "person.2.slash")
                        .font(.largeTitle).foregroundStyle(.tertiary)
                    Text("Henüz arkadaşın yok\nRumuz ile arkadaş ekle!")
                        .multilineTextAlignment(.center)
                        .font(.subheadline).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding()
            } else {
                List(vm.arkadaslar) { arkadas in
                    HStack {
                        Image(systemName: "person.circle.fill")
                            .foregroundStyle(arkadas.durum == .kabul ? .orange : .gray)
                            .font(.title3)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("@\(arkadas.rumuz)")
                                .font(.subheadline.weight(.medium))
                            Text(arkadas.durum == .beklemede ? "İstek gönderildi" : "Arkadaş")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        if arkadas.durum == .kabul {
                            Button(role: .destructive) {
                                vm.arkadasSil(arkadasId: arkadas.id)
                            } label: {
                                Image(systemName: "person.badge.minus")
                            }
                            .buttonStyle(.plain)
                            .foregroundStyle(.red)
                        }
                    }
                    .padding(.vertical, 2)
                }
            }
        }
        .task {
            await FirestoreServisi.shared.anonimGirisYap()
            vm.yukle()
        }
    }

    private func istekGonder() async {
        istekGonderiyor = true
        istekHata = nil
        istekBasarili = false
        do {
            try await vm.istekGonder(hedefRumuz: istekRumuz.trimmingCharacters(in: .whitespaces))
            istekBasarili = true
            istekRumuz = ""
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                istekBasarili = false
            }
        } catch {
            istekHata = error.localizedDescription
        }
        istekGonderiyor = false
    }
}
