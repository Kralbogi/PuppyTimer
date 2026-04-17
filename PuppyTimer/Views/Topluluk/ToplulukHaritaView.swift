// =============================================================================
// PawLand macOS — ToplulukHaritaView
// MapKit ile topluluk köpek konumları
// =============================================================================

import SwiftUI
import MapKit
import CoreLocation

struct KopekKonumAnnotation: Identifiable {
    let id: String
    let coordinate: CLLocationCoordinate2D
    let kopekAdi: String
    let sahipAdi: String
    let platform: String
}

@MainActor
class ToplulukHaritaViewModel: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published var konumlar: [KopekKonumAnnotation] = []
    @Published var kameraKonum: MapCameraPosition = .automatic
    @Published var hata: String?
    @Published var yukleniyor = false
    @Published var konumPaylasılıyor = false

    private let firestoreServisi = FirestoreServisi.shared
    private let locationManager = CLLocationManager()
    private var mevcutKonum: CLLocationCoordinate2D?

    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    }

    func konumlariYukle() {
        yukleniyor = true
        firestoreServisi.haritaKonumlariniDinle { [weak self] veriler in
            guard let self else { return }
            let annotasyonlar = veriler.compactMap { veri -> KopekKonumAnnotation? in
                guard
                    let uid = veri["uid"] as? String,
                    let enlem = veri["enlem"] as? Double,
                    let boylam = veri["boylam"] as? Double,
                    let kopekAdi = veri["kopekAdi"] as? String
                else { return nil }

                return KopekKonumAnnotation(
                    id: uid,
                    coordinate: CLLocationCoordinate2D(latitude: enlem, longitude: boylam),
                    kopekAdi: kopekAdi,
                    sahipAdi: veri["sahipAd"] as? String ?? "Anonim",
                    platform: veri["platform"] as? String ?? "web"
                )
            }
            self.konumlar = annotasyonlar
            self.yukleniyor = false
        }
    }

    func konumPaylasiminiBaslat(kopekAdi: String) {
        locationManager.requestWhenInUseAuthorization()
        locationManager.startUpdatingLocation()
        konumPaylasılıyor = true
        Task {
            if let konum = mevcutKonum {
                await firestoreServisi.konumGuncelle(enlem: konum.latitude, boylam: konum.longitude, kopekAdi: kopekAdi)
            }
        }
    }

    func konumPaylasiminiDurdur() {
        locationManager.stopUpdatingLocation()
        konumPaylasılıyor = false
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let konum = locations.last?.coordinate else { return }
        Task { @MainActor in
            self.mevcutKonum = konum
            self.kameraKonum = .region(MKCoordinateRegion(
                center: konum,
                latitudinalMeters: 2000,
                longitudinalMeters: 2000
            ))
        }
    }
}

struct ToplulukHaritaView: View {
    @StateObject private var vm = ToplulukHaritaViewModel()
    @State private var kopekAdiGiris = ""
    @State private var paylasimAyarlariGosteriliyor = false

    var body: some View {
        ZStack {
            Map(position: $vm.kameraKonum) {
                ForEach(vm.konumlar) { annotation in
                    Annotation(annotation.kopekAdi, coordinate: annotation.coordinate) {
                        ZStack {
                            Circle()
                                .fill(annotation.platform == "macOS" ? Color.blue : Color.orange)
                                .frame(width: 36, height: 36)
                            Image(systemName: "pawprint.fill")
                                .foregroundStyle(.white)
                                .font(.system(size: 16))
                        }
                        .shadow(radius: 3)
                    }
                }
            }
            .mapStyle(.standard(elevation: .realistic))

            // ── Kontrol paneli ─────────────────────────────────────────
            VStack {
                HStack {
                    Spacer()
                    VStack(spacing: 8) {
                        // Konum paylaşım butonu
                        Button {
                            paylasimAyarlariGosteriliyor.toggle()
                        } label: {
                            Image(systemName: vm.konumPaylasılıyor ? "location.fill" : "location")
                                .font(.title3)
                                .foregroundStyle(vm.konumPaylasılıyor ? .orange : .primary)
                                .frame(width: 36, height: 36)
                                .background(.regularMaterial)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                        .buttonStyle(.plain)
                        .help("Konumunu paylaş")

                        // Yenile
                        Button {
                            vm.konumlariYukle()
                        } label: {
                            Image(systemName: "arrow.clockwise")
                                .font(.title3)
                                .frame(width: 36, height: 36)
                                .background(.regularMaterial)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                        .buttonStyle(.plain)
                        .help("Yenile")
                    }
                    .padding()
                }
                Spacer()

                // ── Durum çubuğu ───────────────────────────────────────
                HStack {
                    if vm.konumPaylasılıyor {
                        Label("Konumunuz paylaşılıyor", systemImage: "location.fill")
                            .foregroundStyle(.orange)
                    } else {
                        Label("\(vm.konumlar.count) köpek haritada", systemImage: "pawprint")
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    if vm.yukleniyor {
                        ProgressView().scaleEffect(0.6)
                    }
                }
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(.regularMaterial)
            }
        }
        .popover(isPresented: $paylasimAyarlariGosteriliyor) {
            VStack(alignment: .leading, spacing: 12) {
                Text("Konum Paylaşımı")
                    .font(.headline)

                if vm.konumPaylasılıyor {
                    Text("Konumunuz şu anda topluluk haritasında görünüyor.")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    Button("Paylaşımı Durdur", role: .destructive) {
                        vm.konumPaylasiminiDurdur()
                        paylasimAyarlariGosteriliyor = false
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.red)
                } else {
                    Text("Köpeğinizin adını girin:")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    TextField("Köpek adı", text: $kopekAdiGiris)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 200)

                    Button("Konumu Paylaş") {
                        vm.konumPaylasiminiBaslat(kopekAdi: kopekAdiGiris.isEmpty ? "Köpeğim" : kopekAdiGiris)
                        paylasimAyarlariGosteriliyor = false
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.orange)
                    .disabled(kopekAdiGiris.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            .padding(16)
            .frame(minWidth: 220)
        }
        .task {
            await FirestoreServisi.shared.anonimGirisYap()
            vm.konumlariYukle()
        }
    }
}
