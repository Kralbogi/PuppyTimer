import Foundation
import SwiftData
import Combine

#if os(macOS)
import AppKit
#else
import UIKit
#endif

@Observable
final class ZamanlayiciServisi {
    static let shared = ZamanlayiciServisi()

    var kalanSureler: [String: TimeInterval] = [:]
    private var timer: Timer?
    private var programlar: [(id: String, hedefTarih: Date)] = []

    private init() {
        uyanisBildiriminiDinle()
    }

    func basla() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.guncelle()
        }
        RunLoop.main.add(timer!, forMode: .common)
    }

    func durdur() {
        timer?.invalidate()
        timer = nil
    }

    func programKaydet(id: String, hedefTarih: Date) {
        programlar.removeAll { $0.id == id }
        programlar.append((id: id, hedefTarih: hedefTarih))

        if timer == nil {
            basla()
        }
    }

    func programSil(id: String) {
        programlar.removeAll { $0.id == id }
        kalanSureler.removeValue(forKey: id)

        if programlar.isEmpty {
            durdur()
        }
    }

    private func guncelle() {
        let simdi = Date()
        for program in programlar {
            let kalan = program.hedefTarih.timeIntervalSince(simdi)
            kalanSureler[program.id] = max(kalan, 0)
        }
    }

    private func uyanisBildiriminiDinle() {
        NSWorkspace.shared.notificationCenter.addObserver(
            forName: NSWorkspace.didWakeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.guncelle()
        }
    }

    static func kalanSureMetni(_ saniye: TimeInterval) -> String {
        guard saniye > 0 else { return "00:00:00" }
        let saat = Int(saniye) / 3600
        let dakika = (Int(saniye) % 3600) / 60
        let sn = Int(saniye) % 60
        return String(format: "%02d:%02d:%02d", saat, dakika, sn)
    }
}
