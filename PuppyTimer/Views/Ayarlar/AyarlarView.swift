import SwiftUI
import FirebaseAuth

struct AyarlarView: View {
    @StateObject private var premiumServisi = PremiumServisi.shared

    var body: some View {
        Form {
            // ── Premium Üyelik ───────────────────────────────────────────────
            Section("Premium Üyelik") {
                if premiumServisi.kontrolEdiliyor {
                    HStack {
                        ProgressView().scaleEffect(0.8)
                        Text("Kontrol ediliyor...").font(.subheadline).foregroundStyle(.secondary)
                    }
                } else if premiumServisi.isPremium {
                    HStack(spacing: 10) {
                        Image(systemName: "crown.fill")
                            .foregroundStyle(.orange)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Premium Üyesiniz!")
                                .font(.headline)
                                .foregroundStyle(.primary)
                            Text("AI analizi ve tüm premium özellikler aktif")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 4)

                    VStack(alignment: .leading, spacing: 6) {
                        Label("AI köpek fotoğrafı analizi", systemImage: "sparkles")
                        Label("AI dışkı sağlık analizi", systemImage: "sparkles")
                        Label("Sınırsız renk değiştirme", systemImage: "paintpalette")
                        Label("Özel aksesuar ve çerçeveler", systemImage: "gift")
                        Label("Topluluk haritası & sohbet", systemImage: "map")
                        Label("Tüm gelecek premium özellikler", systemImage: "star")
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.top, 2)
                } else {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Premium üyelikle tüm özelliklere erişin")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        VStack(alignment: .leading, spacing: 6) {
                            Label("AI köpek fotoğrafı & dışkı analizi", systemImage: "sparkles")
                            Label("Sınırsız renk değiştirme", systemImage: "paintpalette")
                            Label("Özel aksesuar ve çerçeveler", systemImage: "gift")
                            Label("Topluluk haritası & gerçek zamanlı sohbet", systemImage: "map")
                        }
                        .font(.caption)
                        .foregroundStyle(.secondary)

                        Button {
                            // Web uygulamasında Premium satın alma sayfasına yönlendir
                            if let url = URL(string: "https://pawland3448.web.app/premium") {
                                NSWorkspace.shared.open(url)
                            }
                        } label: {
                            Label("Premium'a Geç", systemImage: "crown.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.orange)
                    }
                }
            }

            // ── AI Analizi Hakkında ──────────────────────────────────────────
            Section("AI Analizi") {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 8) {
                        Image(systemName: "lock.shield.fill")
                            .foregroundStyle(.blue)
                        Text("Güvenli Sunucu Tabanlı AI")
                            .font(.subheadline)
                            .fontWeight(.medium)
                    }
                    Text("AI analizi artık sunucu tarafında güvenle çalışıyor. API anahtarı cihazınızda saklanmaz; tüm işlemler güvenli sunucularımız üzerinden yapılır.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 4)
            }

            // ── Hesap ────────────────────────────────────────────────────────
            Section("Hesap") {
                if let user = Auth.auth().currentUser {
                    HStack {
                        Image(systemName: "person.circle")
                            .foregroundStyle(.secondary)
                        Text(user.email ?? "Anonim Kullanıcı")
                            .font(.subheadline)
                        Spacer()
                        Text("ID: \(String(user.uid.prefix(8)))...")
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                }

                Button(role: .destructive) {
                    try? Auth.auth().signOut()
                } label: {
                    Label("Çıkış Yap", systemImage: "arrow.right.square")
                }
            }

            // ── Hakkında ─────────────────────────────────────────────────────
            Section("Hakkında") {
                VStack(alignment: .leading, spacing: 8) {
                    Text("PawLand")
                        .font(.headline)
                    Text("Köpek bakım ve sağlık takip uygulaması")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("v2.0 — macOS 14+")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
                .padding(.vertical, 4)
            }
        }
        .formStyle(.grouped)
        .frame(width: 480, height: 520)
        .task {
            await premiumServisi.premiumMu()
        }
        .onAppear {
            premiumServisi.premiumDinle()
        }
        .onDisappear {
            premiumServisi.dinleyiciTemizle()
        }
    }
}
