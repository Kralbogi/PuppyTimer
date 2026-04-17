import Foundation

extension Date {
    static let turkceFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "tr_TR")
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter
    }()

    static let sadeceTarihFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "tr_TR")
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter
    }()

    static let sadeceSaatFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "tr_TR")
        formatter.dateFormat = "HH:mm"
        return formatter
    }()

    var turkceTarihSaat: String {
        Date.turkceFormatter.string(from: self)
    }

    var turkceTarih: String {
        Date.sadeceTarihFormatter.string(from: self)
    }

    var turkceSaat: String {
        Date.sadeceSaatFormatter.string(from: self)
    }

    var goreceli: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.locale = Locale(identifier: "tr_TR")
        formatter.unitsStyle = .full
        return formatter.localizedString(for: self, relativeTo: Date())
    }

    var bugunMu: Bool {
        Calendar.current.isDateInToday(self)
    }

    var haftaninGunu: Int {
        Calendar.current.component(.weekday, from: self)
    }
}
