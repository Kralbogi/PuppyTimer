import SwiftUI

struct BosSayfaView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "pawprint.fill")
                .font(.system(size: 64))
                .foregroundStyle(.secondary)
            Text("Hoşgeldiniz!")
                .font(.largeTitle)
                .fontWeight(.bold)
            Text("Başlangıç için kenar çubuğundan bir köpek seçin veya yeni bir köpek ekleyin.")
                .font(.title3)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 400)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
