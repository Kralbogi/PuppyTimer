// =============================================================================
// PawLand macOS — PremiumView
// Premium özellikleri göster, satın alma akışını web'e yönlendir
// =============================================================================

import SwiftUI

struct PremiumOzellik: Identifiable {
    let id = UUID()
    let ikon: String
    let baslik: String
    let aciklama: String
}

let premiumOzellikler: [PremiumOzellik] = [
    PremiumOzellik(ikon: "sparkles",           baslik: "AI Köpek Analizi",      aciklama: "Fotoğraftan ırk, renk ve karakter analizi"),
    PremiumOzellik(ikon: "sparkles.rectangle.stack", baslik: "AI Sağlık Analizi",  aciklama: "Dışkı fotoğrafından sağlık değerlendirmesi"),
    PremiumOzellik(ikon: "paintpalette.fill",  baslik: "Sınırsız Renk",        aciklama: "Köpek avatarını istediğin gibi özelleştir"),
    PremiumOzellik(ikon: "gift.fill",          baslik: "Özel Aksesuarlar",     aciklama: "Benzersiz şapkalar, kıyafetler ve çerçeveler"),
    PremiumOzellik(ikon: "map.fill",           baslik: "Topluluk Haritası",    aciklama: "Haritada görün, yakınındaki köpekleri bul"),
    PremiumOzellik(ikon: "bubble.left.and.bubble.right.fill", baslik: "Topluluk Sohbeti", aciklama: "Gerçek zamanlı topluluk chatine katıl"),
    PremiumOzellik(ikon: "crown.fill",         baslik: "Tüm Gelecek Özellikler", aciklama: "Eklenecek her yeni özelliğe erişim"),
]

struct PremiumView: View {
    @StateObject private var premiumServisi = PremiumServisi.shared
    @State private var animasyon = false

    var body: some View {
        ScrollView {
            VStack(spacing: 28) {
                // ── Başlık ────────────────────────────────────────────────
                VStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(LinearGradient(
                                colors: [.orange, .pink],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ))
                            .frame(width: 80, height: 80)
                            .scaleEffect(animasyon ? 1.05 : 1.0)
                            .animation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true), value: animasyon)

                        Image(systemName: "crown.fill")
                            .font(.system(size: 36))
                            .foregroundStyle(.white)
                    }

                    if premiumServisi.isPremium {
                        VStack(spacing: 6) {
                            Text("Premium Üyesiniz!")
                                .font(.title2.weight(.bold))
                            Text("Tüm özelliklere erişiminiz aktif")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    } else {
                        VStack(spacing: 6) {
                            Text("PawLand Premium")
                                .font(.title2.weight(.bold))
                            Text("Köpeğiniz için en iyi deneyim")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding(.top, 24)

                // ── Özellikler ────────────────────────────────────────────
                VStack(spacing: 0) {
                    Text("Premium Özellikler")
                        .font(.headline)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 20)
                        .padding(.bottom, 12)

                    ForEach(premiumOzellikler) { ozellik in
                        HStack(spacing: 14) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(Color.orange.opacity(0.15))
                                    .frame(width: 44, height: 44)
                                Image(systemName: ozellik.ikon)
                                    .font(.system(size: 20))
                                    .foregroundStyle(.orange)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                HStack {
                                    Text(ozellik.baslik)
                                        .font(.subheadline.weight(.semibold))
                                    if premiumServisi.isPremium {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundStyle(.green)
                                            .font(.caption)
                                    }
                                }
                                Text(ozellik.aciklama)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 10)

                        if ozellik.id != premiumOzellikler.last?.id {
                            Divider().padding(.leading, 78)
                        }
                    }
                }
                .background(Color(nsColor: .controlBackgroundColor))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .padding(.horizontal, 20)

                // ── Satın alma / aktif durum ──────────────────────────────
                if premiumServisi.isPremium {
                    HStack {
                        Image(systemName: "checkmark.seal.fill")
                            .foregroundStyle(.green)
                        Text("Premium üyeliğiniz aktif")
                            .font(.subheadline.weight(.medium))
                    }
                    .padding()
                    .background(Color.green.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                } else {
                    VStack(spacing: 12) {
                        Button {
                            if let url = URL(string: "https://pawland3448.web.app/premium") {
                                NSWorkspace.shared.open(url)
                            }
                        } label: {
                            HStack {
                                Image(systemName: "crown.fill")
                                Text("Premium'a Geç")
                                    .fontWeight(.bold)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.orange)
                        .controlSize(.large)

                        Text("Satın alma web tarayıcısında gerçekleşir.\nSatın aldıktan sonra uygulamayı yenilemeniz yeterlidir.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.horizontal, 20)
                }

                Spacer(minLength: 24)
            }
        }
        .onAppear {
            animasyon = true
            premiumServisi.premiumDinle()
        }
        .onDisappear {
            premiumServisi.dinleyiciTemizle()
        }
    }
}
