import SwiftUI
import SwiftData

struct MenuBarView: View {
    @Query(sort: \Kopek.ad) private var kopekler: [Kopek]
    @Environment(\.modelContext) private var modelContext

    private let zamanlayici = ZamanlayiciServisi.shared

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Başlık
            HStack {
                Image(systemName: "pawprint.fill")
                    .foregroundStyle(.orange)
                Text("PuppyTimer")
                    .font(.headline)
                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.top, 8)

            Divider()

            if kopekler.isEmpty {
                Text("Henüz köpek eklenmemiş.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 12)
            } else {
                ForEach(kopekler) { kopek in
                    kopekBolumu(kopek)
                }
            }

            Divider()

            // Alt Butonlar
            Button {
                NSApp.activate(ignoringOtherApps: true)
                if let window = NSApp.windows.first(where: { $0.title.contains("PuppyTimer") || $0.isKeyWindow }) {
                    window.makeKeyAndOrderFront(nil)
                }
            } label: {
                Label("Uygulamayı Aç", systemImage: "macwindow")
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 12)

            Button {
                NSApp.terminate(nil)
            } label: {
                Label("Çıkış", systemImage: "power")
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 12)
            .padding(.bottom, 8)
        }
        .frame(width: 300)
    }

    // MARK: - Köpek Bölümü

    @ViewBuilder
    private func kopekBolumu(_ kopek: Kopek) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                KopekAvatarView(kopek: kopek, boyut: 24)
                Text(kopek.ad)
                    .font(.subheadline)
                    .fontWeight(.semibold)
            }
            .padding(.horizontal, 12)

            // Bugünün tuvalet özeti
            let bugunTuvalet = kopek.tuvaletKayitlari.filter { $0.tarih.bugunMu }
            if !bugunTuvalet.isEmpty {
                HStack(spacing: 12) {
                    let buyuk = bugunTuvalet.filter { $0.tur == .buyuk }.count
                    let kucuk = bugunTuvalet.filter { $0.tur == .kucuk }.count

                    Label("\(buyuk) büyük", systemImage: "leaf.fill")
                        .font(.caption)
                        .foregroundStyle(.brown)

                    Label("\(kucuk) küçük", systemImage: "drop.fill")
                        .font(.caption)
                        .foregroundStyle(.yellow)

                    if bugunTuvalet.contains(where: \.uyariVar) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.caption)
                            .foregroundStyle(.red)
                    }
                }
                .padding(.horizontal, 12)
            }

            let aktifMamalar = kopek.beslenmeProgramlari.filter(\.aktif)
            let aktifSular = kopek.suProgramlari.filter(\.aktif)

            if aktifMamalar.isEmpty && aktifSular.isEmpty && bugunTuvalet.isEmpty {
                Text("Aktif zamanlayıcı yok")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 12)
            } else {
                ForEach(aktifMamalar) { program in
                    let pid = "mama_\(program.persistentModelID.hashValue.description)"
                    zamanlayiciSatir(
                        ikon: "fork.knife",
                        baslik: program.baslik,
                        kalan: zamanlayici.kalanSureler[pid] ?? 0,
                        renk: .orange
                    ) {
                        mamaHizliBeslendi(program: program, kopek: kopek)
                    }
                }

                ForEach(aktifSular) { program in
                    let pid = "su_\(program.persistentModelID.hashValue.description)"
                    zamanlayiciSatir(
                        ikon: "drop.fill",
                        baslik: "Su",
                        kalan: zamanlayici.kalanSureler[pid] ?? 0,
                        renk: .blue
                    ) {
                        suHizliVerildi(program: program, kopek: kopek)
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }

    private func zamanlayiciSatir(
        ikon: String, baslik: String, kalan: TimeInterval,
        renk: Color, tamamla: @escaping () -> Void
    ) -> some View {
        HStack(spacing: 8) {
            Image(systemName: ikon)
                .foregroundStyle(renk)
                .frame(width: 16)

            Text(baslik)
                .font(.caption)

            Spacer()

            Text(ZamanlayiciServisi.kalanSureMetni(kalan))
                .font(.system(.caption, design: .monospaced))
                .foregroundStyle(kalan <= 0 ? .red : .secondary)

            Button("Tamam") {
                tamamla()
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.mini)
            .tint(renk)
        }
        .padding(.horizontal, 12)
    }

    // MARK: - Hizli Aksiyonlar

    private func mamaHizliBeslendi(program: BeslenmeProgrami, kopek: Kopek) {
        let kayit = BeslenmeKaydi(tur: .mama, kopek: kopek)
        kayit.miktar = program.miktar
        modelContext.insert(kayit)

        program.sonBeslenme = Date()
        let hedef = Date().addingTimeInterval(TimeInterval(program.saatAraligi * 3600))
        program.birSonrakiBeslenme = hedef
        try? modelContext.save()

        let programID = program.persistentModelID.hashValue.description
        zamanlayici.programKaydet(id: "mama_\(programID)", hedefTarih: hedef)

        BildirimYoneticisi.shared.zamanlayiciBildirimiPlanla(
            kopekAdi: kopek.ad,
            tur: .mama,
            sure: TimeInterval(program.saatAraligi * 3600),
            programID: programID
        )
    }

    private func suHizliVerildi(program: SuProgrami, kopek: Kopek) {
        let kayit = SuKaydi(kopek: kopek)
        modelContext.insert(kayit)

        program.sonSuVerme = Date()
        let hedef = Date().addingTimeInterval(TimeInterval(program.saatAraligi * 3600))
        program.birSonrakiSuVerme = hedef
        try? modelContext.save()

        let programID = program.persistentModelID.hashValue.description
        zamanlayici.programKaydet(id: "su_\(programID)", hedefTarih: hedef)

        BildirimYoneticisi.shared.zamanlayiciBildirimiPlanla(
            kopekAdi: kopek.ad,
            tur: .su,
            sure: TimeInterval(program.saatAraligi * 3600),
            programID: programID
        )
    }
}
