import AppKit
import CoreImage
import CoreImage.CIFilterBuiltins

enum AvatarStil: String, CaseIterable {
    case pop = "Pop Art"
    case suluboya = "Suluboya"
    case neon = "Neon"
    case pixel = "Pixel Art"
    case vintage = "Vintage"
}

struct AvatarOlusturucu {
    private static let context = CIContext()
    private static let avatarBoyut: CGFloat = 512

    static func olustur(fotoData: Data, stil: AvatarStil = .pop) -> Data? {
        guard let ciImage = CIImage(data: fotoData) else { return nil }

        // Oncelik: Yuz/obje merkezleme icin kare kirp
        let kirpilmis = kareKirp(ciImage)

        let islenmiş: CIImage?

        switch stil {
        case .pop:
            islenmiş = popArtUygula(kirpilmis)
        case .suluboya:
            islenmiş = suluboyaUygula(kirpilmis)
        case .neon:
            islenmiş = neonUygula(kirpilmis)
        case .pixel:
            islenmiş = pixelArtUygula(kirpilmis)
        case .vintage:
            islenmiş = vintageUygula(kirpilmis)
        }

        guard let sonuc = islenmiş else { return nil }
        return ciImageToData(sonuc)
    }

    // MARK: - Kare Kirpma

    private static func kareKirp(_ image: CIImage) -> CIImage {
        let boyut = min(image.extent.width, image.extent.height)
        let x = (image.extent.width - boyut) / 2
        let y = (image.extent.height - boyut) / 2
        return image.cropped(to: CGRect(x: x, y: y, width: boyut, height: boyut))
            .transformed(by: CGAffineTransform(translationX: -x, y: -y))
    }

    // MARK: - Stiller

    private static func popArtUygula(_ image: CIImage) -> CIImage? {
        // 1. Canli renkler
        let vibrance = CIFilter.vibrance()
        vibrance.inputImage = image
        vibrance.amount = 1.0
        guard let canli = vibrance.outputImage else { return nil }

        // 2. Kontrast artir
        let kontrast = CIFilter.colorControls()
        kontrast.inputImage = canli
        kontrast.contrast = 1.4
        kontrast.saturation = 1.8
        kontrast.brightness = 0.05
        guard let kontrastli = kontrast.outputImage else { return nil }

        // 3. Posterize (az renk, canli)
        let posterize = CIFilter.colorPosterize()
        posterize.inputImage = kontrastli
        posterize.levels = 5
        guard let poster = posterize.outputImage else { return nil }

        // 4. Hafif yumusatma
        let blur = CIFilter.gaussianBlur()
        blur.inputImage = poster
        blur.radius = 1.0

        return blur.outputImage?.cropped(to: image.extent)
    }

    private static func suluboyaUygula(_ image: CIImage) -> CIImage? {
        // 1. Yumusatma (suluboya etkisi)
        let blur = CIFilter.gaussianBlur()
        blur.inputImage = image
        blur.radius = 4.0
        guard let bulanik = blur.outputImage?.cropped(to: image.extent) else { return nil }

        // 2. Posterize
        let posterize = CIFilter.colorPosterize()
        posterize.inputImage = bulanik
        posterize.levels = 8
        guard let poster = posterize.outputImage else { return nil }

        // 3. Renkleri canlandir
        let vibrance = CIFilter.vibrance()
        vibrance.inputImage = poster
        vibrance.amount = 0.6
        guard let canli = vibrance.outputImage else { return nil }

        // 4. Hafif kenar birlestirme
        let blend = CIFilter.softLightBlendMode()
        blend.inputImage = canli
        blend.backgroundImage = image

        return blend.outputImage
    }

    private static func neonUygula(_ image: CIImage) -> CIImage? {
        // 1. Kenar tespiti
        let edges = CIFilter.edges()
        edges.inputImage = image
        edges.intensity = 8.0
        guard let kenarlar = edges.outputImage else { return nil }

        // 2. Kenarlari renklendir
        let hueAdjust = CIFilter.hueAdjust()
        hueAdjust.inputImage = kenarlar
        hueAdjust.angle = 2.0
        guard let renkli = hueAdjust.outputImage else { return nil }

        // 3. Parlaklik artir
        let kontrast = CIFilter.colorControls()
        kontrast.inputImage = renkli
        kontrast.brightness = 0.1
        kontrast.contrast = 2.0
        kontrast.saturation = 3.0
        guard let parlak = kontrast.outputImage else { return nil }

        // 4. Siyah arka plan uzerine birlestir
        let siyah = CIImage(color: CIColor.black).cropped(to: image.extent)
        let blend = CIFilter.screenBlendMode()
        blend.inputImage = parlak
        blend.backgroundImage = siyah

        return blend.outputImage
    }

    private static func pixelArtUygula(_ image: CIImage) -> CIImage? {
        // 1. Pixellestir
        let pixellate = CIFilter.pixellate()
        pixellate.inputImage = image
        pixellate.scale = 12.0
        guard let piksel = pixellate.outputImage else { return nil }

        // 2. Renkleri azalt
        let posterize = CIFilter.colorPosterize()
        posterize.inputImage = piksel
        posterize.levels = 4
        guard let poster = posterize.outputImage else { return nil }

        // 3. Doygunluk artir
        let kontrast = CIFilter.colorControls()
        kontrast.inputImage = poster
        kontrast.saturation = 1.5
        kontrast.contrast = 1.2

        return kontrast.outputImage
    }

    private static func vintageUygula(_ image: CIImage) -> CIImage? {
        // 1. Sepia efekti
        let sepia = CIFilter.sepiaTone()
        sepia.inputImage = image
        sepia.intensity = 0.4
        guard let sepiaImg = sepia.outputImage else { return nil }

        // 2. Vignette
        let vignette = CIFilter.vignette()
        vignette.inputImage = sepiaImg
        vignette.intensity = 1.5
        vignette.radius = 2.0
        guard let vignetteImg = vignette.outputImage else { return nil }

        // 3. Hafif parlaklik
        let kontrast = CIFilter.colorControls()
        kontrast.inputImage = vignetteImg
        kontrast.brightness = 0.05
        kontrast.contrast = 1.1

        return kontrast.outputImage
    }

    // MARK: - Donusum

    private static func ciImageToData(_ ciImage: CIImage) -> Data? {
        let scale = avatarBoyut / max(ciImage.extent.width, ciImage.extent.height)
        let scaled = ciImage.transformed(by: CGAffineTransform(scaleX: scale, y: scale))

        guard let cgImage = context.createCGImage(scaled, from: scaled.extent) else {
            return nil
        }

        let nsImage = NSImage(cgImage: cgImage, size: NSSize(width: avatarBoyut, height: avatarBoyut))

        guard let tiffData = nsImage.tiffRepresentation,
              let bitmap = NSBitmapImageRep(data: tiffData),
              let pngData = bitmap.representation(using: .png, properties: [.compressionFactor: 0.9]) else {
            return nil
        }

        return pngData
    }
}
