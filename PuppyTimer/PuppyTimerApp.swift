import SwiftUI
import SwiftData

@main
struct PuppyTimerApp: App {
    let modelContainer: ModelContainer

    init() {
        do {
            let schema = Schema([
                Kopek.self,
                BeslenmeProgrami.self,
                SuProgrami.self,
                BeslenmeKaydi.self,
                SuKaydi.self,
                YuruyusProgrami.self,
                YuruyusKaydi.self,
                AsiKaydi.self,
                VeterinerZiyareti.self,
                IlacTakibi.self,
                SaglikNotu.self,
                TuvaletKaydi.self,
                HaritaIsaretci.self
            ])
            let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
            modelContainer = try ModelContainer(for: schema, configurations: [config])
        } catch {
            fatalError("ModelContainer oluşturulamadı: \(error)")
        }

        BildirimYoneticisi.shared.izinIste()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(modelContainer)
        .defaultSize(width: 1000, height: 700)

        MenuBarExtra("PuppyTimer", systemImage: "pawprint.fill") {
            MenuBarView()
                .modelContainer(modelContainer)
        }
        .menuBarExtraStyle(.window)

        Settings {
            AyarlarView()
        }
    }
}
