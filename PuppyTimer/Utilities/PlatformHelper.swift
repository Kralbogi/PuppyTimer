import Foundation
import SwiftUI

#if os(macOS)
import AppKit
#else
import UIKit
#endif

/// Cross-platform image utilities for iOS and macOS
enum PlatformHelper {

    // MARK: - Image Loading from Data

    static func imageFromData(_ data: Data) -> Image? {
        #if os(macOS)
        guard let nsImage = NSImage(data: data) else { return nil }
        return Image(nsImage: nsImage)
        #else
        guard let uiImage = UIImage(data: data) else { return nil }
        return Image(uiImage: uiImage)
        #endif
    }

    // MARK: - Opening URLs

    static func openURL(_ url: URL) {
        #if os(macOS)
        NSWorkspace.shared.open(url)
        #else
        UIApplication.shared.open(url)
        #endif
    }

    // MARK: - Wake Notification Observer

    static func addWakeNotificationObserver(
        _ observer: Any,
        selector: Selector
    ) {
        #if os(macOS)
        NSWorkspace.shared.notificationCenter.addObserver(
            observer,
            selector: selector,
            name: NSWorkspace.didWakeNotification,
            object: nil
        )
        #else
        // iOS: Use UIApplication.didBecomeActiveNotification instead
        NotificationCenter.default.addObserver(
            observer,
            selector: selector,
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
        #endif
    }

    static func removeWakeNotificationObserver(_ observer: Any) {
        #if os(macOS)
        NSWorkspace.shared.notificationCenter.removeObserver(observer)
        #else
        NotificationCenter.default.removeObserver(observer)
        #endif
    }
}
