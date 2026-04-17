import SwiftUI

#if os(macOS)
import AppKit
#else
import UIKit
#endif

struct AvatarOnizlemeView: View {
    var viewModel: OnboardingViewModel

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Text("Avatar Oluştur")
                .font(.title)
                .fontWeight(.bold)

            if viewModel.yukleniyor {
                yukleniyorAlani
            } else {
                karsilastirmaAlani
                stilSecici
                analizAlani
                hataAlani
            }

            Spacer()
            navigasyonAlani
        }
        .padding(20)
        .task {
            if viewModel.avatarData == nil {
                await viewModel.fotoAnalizEt()
            }
        }
    }

    // MARK: - Alt Gorunumler

    private var yukleniyorAlani: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Avatar oluşturuluyor ve fotoğraf analiz ediliyor...")
                .foregroundStyle(.secondary)
        }
        .frame(height: 260)
    }

    private var karsilastirmaAlani: some View {
        HStack(spacing: 32) {
            orijinalFoto
            Image(systemName: "arrow.right")
                .font(.title2)
                .foregroundStyle(.secondary)
            avatarFoto
        }
    }

    private var orijinalFoto: some View {
        VStack(spacing: 8) {
            Group {
                if let data = viewModel.kopekFoto, let nsImage = NSImage(data: data) {
                    Image(nsImage: nsImage)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 160, height: 160)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                } else {
                    Color.clear.frame(width: 160, height: 160)
                }
            }
            Text("Orijinal")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    private var avatarFoto: some View {
        VStack(spacing: 8) {
            Group {
                if let data = viewModel.avatarData, let nsImage = NSImage(data: data) {
                    Image(nsImage: nsImage)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 160, height: 160)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .shadow(color: Color.orange.opacity(0.3), radius: 8, y: 4)
                } else {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.secondary.opacity(0.1))
                        .frame(width: 160, height: 160)
                        .overlay {
                            Image(systemName: "pawprint.fill")
                                .font(.system(size: 48))
                                .foregroundStyle(.secondary)
                        }
                }
            }
            Text("Avatar")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    private var stilSecici: some View {
        HStack(spacing: 12) {
            ForEach(AvatarStil.allCases, id: \.self) { stil in
                Button(stil.rawValue) {
                    viewModel.avatarStilDegistir(stil)
                }
                .buttonStyle(.bordered)
                .tint(viewModel.avatarStil == stil ? .orange : .secondary)
                .controlSize(.small)
            }
        }
    }

    @ViewBuilder
    private var analizAlani: some View {
        if let analiz = viewModel.kopekAnalizi {
            VStack(alignment: .leading, spacing: 6) {
                Label("AI Analiz Sonucu", systemImage: "sparkles")
                    .font(.subheadline)
                    .fontWeight(.semibold)

                HStack(spacing: 16) {
                    analizBilgi("Irk", analiz.irk)
                    analizBilgi("Renk", analiz.renk)
                    analizBilgi("Boyut", analiz.boyut)
                }

                if !analiz.genel.isEmpty {
                    Text(analiz.genel)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.orange.opacity(0.05))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.orange.opacity(0.2), lineWidth: 1)
            )
        }
    }

    @ViewBuilder
    private var hataAlani: some View {
        if let hata = viewModel.hata {
            Text(hata)
                .font(.caption)
                .foregroundStyle(.orange)
        }
    }

    private var navigasyonAlani: some View {
        HStack {
            Button("Geri") {
                viewModel.geri()
            }
            Spacer()
            if !viewModel.yukleniyor {
                Button("Devam") {
                    viewModel.ileri()
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 20)
    }

    private func analizBilgi(_ baslik: String, _ deger: String) -> some View {
        VStack(spacing: 2) {
            Text(baslik)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(deger)
                .font(.caption)
                .fontWeight(.medium)
        }
    }
}
