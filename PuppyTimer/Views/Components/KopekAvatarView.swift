import SwiftUI

struct KopekAvatarView: View {
    let kopek: Kopek
    var boyut: CGFloat = 48

    var body: some View {
        Group {
            if let data = kopek.avatarData, let nsImage = NSImage(data: data) {
                Image(nsImage: nsImage)
                    .resizable()
                    .scaledToFill()
            } else if let data = kopek.fotoData, let nsImage = NSImage(data: data) {
                Image(nsImage: nsImage)
                    .resizable()
                    .scaledToFill()
            } else {
                Image(systemName: "dog.fill")
                    .resizable()
                    .scaledToFit()
                    .padding(boyut * 0.2)
                    .foregroundStyle(.white)
                    .background(
                        Circle().fill(
                            kopek.cinsiyet == .erkek ? Color.blue.opacity(0.7) : Color.pink.opacity(0.7)
                        )
                    )
            }
        }
        .frame(width: boyut, height: boyut)
        .clipShape(Circle())
    }
}
