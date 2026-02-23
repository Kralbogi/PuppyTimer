import SwiftUI
import SwiftData

struct OnboardingContainerView: View {
    var onTamamla: () -> Void

    @Environment(\.modelContext) private var modelContext
    @State private var viewModel: OnboardingViewModel?

    var body: some View {
        VStack(spacing: 0) {
            if let vm = viewModel {
                // Ilerleme gostergesi
                ilerlemeGostergesi(adim: vm.adim)

                // Icerik
                Group {
                    switch vm.adim {
                    case .hosgeldin:
                        HosgeldinView(viewModel: vm)
                    case .fotoSec:
                        FotoSecOnboardingView(viewModel: vm)
                    case .avatarOlustur:
                        AvatarOnizlemeView(viewModel: vm)
                    case .bilgiGir:
                        KopekBilgiOnboardingView(viewModel: vm)
                    case .tamamlandi:
                        TamamlandiView(viewModel: vm, onTamamla: onTamamla)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .frame(width: 600, height: 500)
        .onAppear {
            viewModel = OnboardingViewModel(modelContext: modelContext)
        }
    }

    private func ilerlemeGostergesi(adim: OnboardingAdim) -> some View {
        HStack(spacing: 8) {
            ForEach(OnboardingAdim.allCases, id: \.rawValue) { a in
                Capsule()
                    .fill(a.rawValue <= adim.rawValue ? Color.orange : Color.secondary.opacity(0.2))
                    .frame(height: 4)
            }
        }
        .padding(.horizontal, 40)
        .padding(.top, 20)
    }
}
