import SwiftUI
import SwiftData

struct KopekListView: View {
    @Query(sort: \Kopek.ad) private var kopekler: [Kopek]
    @Environment(\.modelContext) private var modelContext
    @State private var kopekEkleGoster = false

    var body: some View {
        List {
            ForEach(kopekler) { kopek in
                HStack(spacing: 12) {
                    KopekAvatarView(kopek: kopek, boyut: 40)

                    VStack(alignment: .leading) {
                        Text(kopek.ad)
                            .fontWeight(.semibold)
                        Text(kopek.irk)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Text(kopek.cinsiyet.baslik)
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(
                            Capsule().fill(
                                kopek.cinsiyet == .erkek ? Color.blue.opacity(0.2) : Color.pink.opacity(0.2)
                            )
                        )
                }
                .padding(.vertical, 4)
            }
            .onDelete { indexSet in
                for index in indexSet {
                    modelContext.delete(kopekler[index])
                }
                try? modelContext.save()
            }
        }
        .overlay {
            if kopekler.isEmpty {
                ContentUnavailableView(
                    "Henüz köpek eklenmemiş",
                    systemImage: "pawprint",
                    description: Text("Yeni köpek eklemek için + butonuna tıklayın.")
                )
            }
        }
        .toolbar {
            ToolbarItem {
                Button("Köpek Ekle", systemImage: "plus") {
                    kopekEkleGoster = true
                }
            }
        }
        .sheet(isPresented: $kopekEkleGoster) {
            KopekEkleView()
        }
    }
}
