// =============================================================================
// PawLand macOS — ToplulukSohbetView
// Firestore gerçek zamanlı topluluk sohbeti
// =============================================================================

import SwiftUI
import FirebaseAuth

struct ChatMesaji: Identifiable {
    let id: String
    let gonderenId: String
    let gonderenAd: String
    let mesaj: String
    let tarih: Date
    let platform: String

    var benimMesajimMi: Bool {
        gonderenId == Auth.auth().currentUser?.uid
    }
}

@MainActor
class ToplulukSohbetViewModel: ObservableObject {
    @Published var mesajlar: [ChatMesaji] = []
    @Published var yukleniyor = true
    @Published var gonderenAd: String = UserDefaults.standard.string(forKey: "rumuz") ?? "Anonim"

    private let firestoreServisi = FirestoreServisi.shared

    func mesajlariDinle() {
        firestoreServisi.chatMesajlariniDinle { [weak self] veriler in
            guard let self else { return }
            let mesajlar = veriler.compactMap { veri -> ChatMesaji? in
                guard
                    let gonderenId  = veri["gonderenId"] as? String,
                    let gonderenAd  = veri["gonderenAd"] as? String,
                    let mesajMetni  = veri["mesaj"] as? String
                else { return nil }

                let id = veri["id"] as? String ?? UUID().uuidString
                let tarih: Date
                if let ts = veri["tarih"] as? [String: Any],
                   let seconds = ts["_seconds"] as? Double {
                    tarih = Date(timeIntervalSince1970: seconds)
                } else {
                    tarih = Date()
                }

                return ChatMesaji(
                    id: id,
                    gonderenId: gonderenId,
                    gonderenAd: gonderenAd,
                    mesaj: mesajMetni,
                    tarih: tarih,
                    platform: veri["platform"] as? String ?? "web"
                )
            }
            self.mesajlar = mesajlar
            self.yukleniyor = false
        }
    }

    func mesajGonder(_ metin: String) {
        Task {
            await firestoreServisi.chatMesajiGonder(
                mesaj: metin,
                gonderenAd: gonderenAd
            )
        }
    }
}

struct ToplulukSohbetView: View {
    @StateObject private var vm = ToplulukSohbetViewModel()
    @State private var mesajMetni = ""
    @State private var scrollProxy: ScrollViewProxy? = nil

    var body: some View {
        VStack(spacing: 0) {
            // ── Mesaj listesi ─────────────────────────────────────────────
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        if vm.yukleniyor {
                            HStack {
                                Spacer()
                                ProgressView("Yükleniyor...")
                                Spacer()
                            }
                            .padding()
                        } else if vm.mesajlar.isEmpty {
                            HStack {
                                Spacer()
                                VStack(spacing: 8) {
                                    Image(systemName: "bubble.left.and.bubble.right")
                                        .font(.largeTitle)
                                        .foregroundStyle(.tertiary)
                                    Text("Henüz mesaj yok.\nİlk mesajı sen gönder!")
                                        .multilineTextAlignment(.center)
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                            }
                            .padding(.top, 40)
                        } else {
                            ForEach(vm.mesajlar) { mesaj in
                                MesajSatiri(mesaj: mesaj)
                                    .id(mesaj.id)
                            }
                        }
                    }
                    .padding()
                }
                .onChange(of: vm.mesajlar.count) {
                    if let last = vm.mesajlar.last {
                        withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                    }
                }
            }

            Divider()

            // ── Mesaj giriş alanı ─────────────────────────────────────────
            HStack(spacing: 8) {
                TextField("Mesaj yaz...", text: $mesajMetni, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(1...4)
                    .onSubmit {
                        gonder()
                    }

                Button(action: gonder) {
                    Image(systemName: "paperplane.fill")
                        .foregroundStyle(.white)
                        .frame(width: 32, height: 32)
                        .background(mesajMetni.trimmingCharacters(in: .whitespaces).isEmpty ? Color.gray : Color.orange)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
                .disabled(mesajMetni.trimmingCharacters(in: .whitespaces).isEmpty)
                .keyboardShortcut(.return, modifiers: .command)
            }
            .padding(12)
            .background(.regularMaterial)
        }
        .task {
            await FirestoreServisi.shared.anonimGirisYap()
            vm.mesajlariDinle()
        }
    }

    private func gonder() {
        let temiz = mesajMetni.trimmingCharacters(in: .whitespaces)
        guard !temiz.isEmpty else { return }
        vm.mesajGonder(temiz)
        mesajMetni = ""
    }
}

struct MesajSatiri: View {
    let mesaj: ChatMesaji

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            if mesaj.benimMesajimMi { Spacer() }

            VStack(alignment: mesaj.benimMesajimMi ? .trailing : .leading, spacing: 3) {
                if !mesaj.benimMesajimMi {
                    HStack(spacing: 4) {
                        Text(mesaj.gonderenAd)
                            .font(.caption2)
                            .fontWeight(.semibold)
                            .foregroundStyle(.secondary)
                        Text(mesaj.platform == "macOS" ? "🖥" : "📱")
                            .font(.caption2)
                    }
                }

                Text(mesaj.mesaj)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(mesaj.benimMesajimMi ? Color.orange : Color(nsColor: .controlBackgroundColor))
                    .foregroundStyle(mesaj.benimMesajimMi ? .white : .primary)
                    .clipShape(RoundedRectangle(cornerRadius: 14))

                Text(mesaj.tarih, style: .time)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
            .frame(maxWidth: 340, alignment: mesaj.benimMesajimMi ? .trailing : .leading)

            if !mesaj.benimMesajimMi { Spacer() }
        }
    }
}
