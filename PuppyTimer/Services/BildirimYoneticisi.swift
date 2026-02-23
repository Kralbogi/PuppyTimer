import Foundation
import UserNotifications

enum BildirimTuru: String {
    case mama = "mama"
    case su = "su"
    case yuruyus = "yuruyus"
    case ilac = "ilac"
    case asi = "asi"
    case tuvalet = "tuvalet"
}

final class BildirimYoneticisi: NSObject, UNUserNotificationCenterDelegate {
    static let shared = BildirimYoneticisi()

    private var center: UNUserNotificationCenter?

    private override init() {
        super.init()
        // Bundle kontrolu - SPM'den calistirmayi destekle
        if Bundle.main.bundleIdentifier != nil {
            let c = UNUserNotificationCenter.current()
            c.delegate = self
            self.center = c
            kategorileriAyarla()
        }
    }

    // MARK: - Izin

    func izinIste() {
        center?.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                print("Bildirim izni hatası: \(error)")
            }
        }
    }

    // MARK: - Kategoriler

    private func kategorileriAyarla() {
        let tamamlaAction = UNNotificationAction(
            identifier: "TAMAMLA",
            title: "Tamamlandı",
            options: []
        )
        let erteleAction = UNNotificationAction(
            identifier: "ERTELE",
            title: "15 dk Ertele",
            options: []
        )

        let turler: [BildirimTuru] = [.mama, .su, .yuruyus, .ilac, .asi]
        var kategoriler = Set<UNNotificationCategory>()

        for tur in turler {
            let kategori = UNNotificationCategory(
                identifier: "\(tur.rawValue)_category",
                actions: [tamamlaAction, erteleAction],
                intentIdentifiers: []
            )
            kategoriler.insert(kategori)
        }

        center?.setNotificationCategories(kategoriler)
    }

    // MARK: - Bildirim Planlama

    func zamanlayiciBildirimiPlanla(
        kopekAdi: String,
        tur: BildirimTuru,
        sure: TimeInterval,
        programID: String
    ) {
        let content = UNMutableNotificationContent()

        switch tur {
        case .mama:
            content.title = "Mama Zamanı!"
            content.body = "\(kopekAdi) için mama vakti geldi."
        case .su:
            content.title = "Su Zamanı!"
            content.body = "\(kopekAdi) için su vakti geldi."
        case .yuruyus:
            content.title = "Yürüyüş Zamanı!"
            content.body = "\(kopekAdi) ile yürüyüşe çıkma vakti."
        case .ilac:
            content.title = "İlaç Zamanı!"
            content.body = "\(kopekAdi) için ilaç vakti geldi."
        case .asi:
            content.title = "Aşı Hatırlatması"
            content.body = "\(kopekAdi) için aşı randevusu yaklaştı."
        case .tuvalet:
            content.title = "Tuvalet Hatırlatması"
            content.body = "\(kopekAdi) için tuvalet molası zamanı."
        }

        content.sound = .default
        content.categoryIdentifier = "\(tur.rawValue)_category"

        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: max(sure, 1),
            repeats: false
        )

        let identifier = "\(tur.rawValue)_\(programID)"

        let request = UNNotificationRequest(
            identifier: identifier,
            content: content,
            trigger: trigger
        )

        center?.removePendingNotificationRequests(withIdentifiers: [identifier])
        center?.add(request) { error in
            if let error = error {
                print("Bildirim planlama hatası: \(error)")
            }
        }
    }

    func bildirimiIptalEt(tur: BildirimTuru, programID: String) {
        let identifier = "\(tur.rawValue)_\(programID)"
        center?.removePendingNotificationRequests(withIdentifiers: [identifier])
    }

    func tumBildirimleriIptalEt() {
        center?.removeAllPendingNotificationRequests()
    }

    // MARK: - Delegate

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound])
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let identifier = response.notification.request.identifier

        switch response.actionIdentifier {
        case "TAMAMLA":
            NotificationCenter.default.post(
                name: .bildirimTamamlandi,
                object: identifier
            )
        case "ERTELE":
            let content = response.notification.request.content
            let trigger = UNTimeIntervalNotificationTrigger(
                timeInterval: 900,
                repeats: false
            )
            let request = UNNotificationRequest(
                identifier: identifier,
                content: content,
                trigger: trigger
            )
            center.add(request)
        default:
            break
        }

        completionHandler()
    }
}

extension Notification.Name {
    static let bildirimTamamlandi = Notification.Name("bildirimTamamlandi")
}
