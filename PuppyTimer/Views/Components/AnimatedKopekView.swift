import SwiftUI

struct Parcacik: Identifiable {
    let id = UUID()
    var x: CGFloat
    var y: CGFloat
    var opacity: Double
    var ikon: String
    var boyut: CGFloat
}

struct AnimatedKopekView: View {
    let kopek: Kopek
    var avatarBoyut: CGFloat = 140

    @State private var nefesAl = false
    @State private var sallan = false
    @State private var parcaciklar: [Parcacik] = []
    @State private var dokunmaSayisi = 0
    @State private var tepkiGoster = false
    @State private var gozKirp = false
    @State private var gorundu = false

    private let parcacikTimer = Timer.publish(every: 2.5, on: .main, in: .common).autoconnect()
    private let kirpmaTimer = Timer.publish(every: 4.0, on: .main, in: .common).autoconnect()

    var body: some View {
        ZStack {
            // Arka plan parlama halkalar
            arkaplanHalkalar

            // Ucan parcaciklar
            parcacikKatmani

            // Ana avatar + animasyonlar
            avatarKatmani

            // Goz kirpma overlay
            gozKirpmaOverlay

            // Dokunma tepkisi
            dokunmaTepkisi

            // Durum baloncuklari
            durumBaloncuklari
        }
        .frame(width: avatarBoyut + 100, height: avatarBoyut + 80)
        .contentShape(Rectangle())
        .onTapGesture {
            dokunmaAnimasyonu()
        }
        .onAppear {
            baslat()
        }
        .onReceive(parcacikTimer) { _ in
            yeniParcacikEkle()
        }
        .onReceive(kirpmaTimer) { _ in
            gozKirpAnimasyonu()
        }
    }

    // MARK: - Arka Plan Halkalar

    private var arkaplanHalkalar: some View {
        ForEach(0..<3, id: \.self) { i in
            Circle()
                .stroke(
                    Color.orange.opacity(0.12 - Double(i) * 0.03),
                    lineWidth: 2
                )
                .frame(
                    width: avatarBoyut + CGFloat(i) * 24 + 10,
                    height: avatarBoyut + CGFloat(i) * 24 + 10
                )
                .scaleEffect(nefesAl ? 1.05 : 0.95)
                .opacity(gorundu ? 1.0 : 0)
                .animation(
                    .easeInOut(duration: 3.0)
                    .repeatForever(autoreverses: true)
                    .delay(Double(i) * 0.3),
                    value: nefesAl
                )
        }
    }

    // MARK: - Avatar Katmani

    private var avatarKatmani: some View {
        KopekAvatarView(kopek: kopek, boyut: avatarBoyut)
            .shadow(
                color: Color.orange.opacity(nefesAl ? 0.4 : 0.2),
                radius: nefesAl ? 16 : 10,
                y: 4
            )
            .scaleEffect(gorundu ? (nefesAl ? 1.03 : 1.0) : 0.3)
            .rotationEffect(.degrees(sallan ? 2 : -2))
            .animation(
                .easeInOut(duration: 3.5)
                .repeatForever(autoreverses: true),
                value: nefesAl
            )
            .animation(
                .easeInOut(duration: 4.0)
                .repeatForever(autoreverses: true),
                value: sallan
            )
    }

    // MARK: - Goz Kirpma

    private var gozKirpmaOverlay: some View {
        Circle()
            .fill(Color.black.opacity(gozKirp ? 0.15 : 0))
            .frame(width: avatarBoyut, height: avatarBoyut)
            .scaleEffect(y: gozKirp ? 0.92 : 1.0)
            .allowsHitTesting(false)
    }

    // MARK: - Parcacik Katmani

    private var parcacikKatmani: some View {
        ForEach(parcaciklar) { p in
            Image(systemName: p.ikon)
                .font(.system(size: p.boyut))
                .foregroundStyle(p.ikon == "heart.fill" ? Color.pink : Color.orange)
                .opacity(p.opacity)
                .offset(x: p.x, y: p.y)
        }
    }

    // MARK: - Dokunma Tepkisi

    @ViewBuilder
    private var dokunmaTepkisi: some View {
        if tepkiGoster {
            VStack(spacing: 2) {
                Text(tepkiEmoji)
                    .font(.system(size: 32))
                Text(tepkiMetni)
                    .font(.caption2)
                    .fontWeight(.medium)
                    .foregroundStyle(.orange)
            }
            .offset(y: -(avatarBoyut / 2 + 20))
            .transition(.scale.combined(with: .opacity))
        }
    }

    private var tepkiEmoji: String {
        switch dokunmaSayisi % 5 {
        case 1: return "🐾"
        case 2: return "❤️"
        case 3: return "🦴"
        case 4: return "😍"
        default: return "🐶"
        }
    }

    private var tepkiMetni: String {
        switch dokunmaSayisi % 5 {
        case 1: return "Hav hav!"
        case 2: return "Seni seviyorum!"
        case 3: return "Kemik ister misin?"
        case 4: return "Mutlu!"
        default: return "Merhaba!"
        }
    }

    // MARK: - Durum Baloncuklari

    private var durumBaloncuklari: some View {
        HStack(spacing: 6) {
            durumIkon("fork.knife", sayi: kopek.beslenmeKayitlari.filter { $0.tarih.bugunMu }.count, renk: .orange)
            durumIkon("figure.walk", sayi: kopek.yuruyusKayitlari.filter { $0.baslamaTarihi.bugunMu }.count, renk: .green)
            durumIkon("leaf.fill", sayi: kopek.tuvaletKayitlari.filter { $0.tarih.bugunMu }.count, renk: .brown)
        }
        .offset(y: avatarBoyut / 2 + 12)
        .opacity(gorundu ? 1.0 : 0)
    }

    private func durumIkon(_ ikon: String, sayi: Int, renk: Color) -> some View {
        HStack(spacing: 3) {
            Image(systemName: ikon)
                .font(.system(size: 10))
                .foregroundStyle(renk)
            Text("\(sayi)")
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundStyle(.primary)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 3)
        .background(
            Capsule()
                .fill(renk.opacity(0.1))
                .overlay(Capsule().stroke(renk.opacity(0.2), lineWidth: 0.5))
        )
    }

    // MARK: - Animasyon Fonksiyonlari

    private func baslat() {
        withAnimation(.spring(response: 0.7, dampingFraction: 0.6)) {
            gorundu = true
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            nefesAl = true
            sallan = true
        }
    }

    private func dokunmaAnimasyonu() {
        dokunmaSayisi += 1

        withAnimation(.spring(response: 0.3, dampingFraction: 0.5)) {
            tepkiGoster = true
        }

        // Kalp parcaciklari patlat
        for i in 0..<5 {
            let acı = Double(i) * (360.0 / 5.0)
            let radyan = acı * .pi / 180
            let mesafe: CGFloat = 60
            let p = Parcacik(
                x: cos(radyan) * mesafe * 0.3,
                y: sin(radyan) * mesafe * 0.3,
                opacity: 1.0,
                ikon: ["heart.fill", "pawprint.fill", "star.fill"].randomElement()!,
                boyut: CGFloat.random(in: 10...16)
            )
            parcaciklar.append(p)

            let idx = parcaciklar.count - 1
            withAnimation(.easeOut(duration: 1.0)) {
                if idx < parcaciklar.count {
                    parcaciklar[idx].x = cos(radyan) * mesafe
                    parcaciklar[idx].y = sin(radyan) * mesafe - 30
                    parcaciklar[idx].opacity = 0
                }
            }
        }

        // Temizle
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            withAnimation(.easeOut(duration: 0.3)) {
                tepkiGoster = false
            }
            parcaciklar.removeAll { $0.opacity <= 0.01 }
        }
    }

    private func yeniParcacikEkle() {
        guard gorundu else { return }
        let ikonlar = ["pawprint.fill", "heart.fill", "sparkle"]
        let p = Parcacik(
            x: CGFloat.random(in: -50...50),
            y: 0,
            opacity: 0.6,
            ikon: ikonlar.randomElement()!,
            boyut: CGFloat.random(in: 8...14)
        )
        parcaciklar.append(p)

        let idx = parcaciklar.count - 1
        withAnimation(.easeOut(duration: 3.0)) {
            if idx < parcaciklar.count {
                parcaciklar[idx].y = -80
                parcaciklar[idx].opacity = 0
            }
        }

        // Eski parcaciklari temizle
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.5) {
            parcaciklar.removeAll { $0.opacity <= 0.01 }
        }
    }

    private func gozKirpAnimasyonu() {
        withAnimation(.easeInOut(duration: 0.12)) {
            gozKirp = true
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            withAnimation(.easeInOut(duration: 0.12)) {
                gozKirp = false
            }
        }
    }
}
