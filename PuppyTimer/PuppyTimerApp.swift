import SwiftUI
import SwiftData
import FirebaseCore
import FirebaseFirestore
import FirebaseAuth

@main
struct PuppyTimerApp: App {
    let modelContainer: ModelContainer

    init() {
        // ── Firebase programatik başlatma (GoogleService-Info.plist gerekmez) ──
        if FirebaseApp.app() == nil {
            let options = FirebaseOptions(
                googleAppID: "1:13724720719:ios:pawland_macos",
                gcmSenderID: "13724720719"
            )
            options.apiKey           = "AIzaSyCv0BKz8w-zD0br70IM-3O2A_QmZIYZ8A4"
            options.projectID        = "pawland3448"
            options.storageBucket    = "pawland3448.firebasestorage.app"
            options.clientID         = "13724720719-macos.apps.googleusercontent.com"
            options.bundleID         = Bundle.main.bundleIdentifier ?? "com.pawland.app"
            FirebaseApp.configure(with: options)
        }

        // ── SwiftData model container ────────────────────────────────────────
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
                HaritaIsaretci.self,
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
        .defaultSize(width: 1100, height: 740)

        MenuBarExtra("PawLand", systemImage: "pawprint.fill") {
            MenuBarView()
                .modelContainer(modelContainer)
        }
        .menuBarExtraStyle(.window)

        Settings {
            AyarlarView()
        }
    }
}
