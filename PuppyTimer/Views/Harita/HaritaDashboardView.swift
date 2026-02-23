import SwiftUI
import SwiftData
import MapKit

struct HaritaDashboardView: View {
    let kopek: Kopek
    @Environment(\.modelContext) private var modelContext
    @State private var viewModel: HaritaViewModel?
    @State private var kameraKonumu: MapCameraPosition = .automatic
    @State private var isaretciEkleGoster = false
    @State private var yeniKonum: CLLocationCoordinate2D?
    @State private var secilenIsaretci: HaritaIsaretci?

    var body: some View {
        VStack(spacing: 0) {
            // Baslik
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Harita")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    Text("\(kopek.ad) için konum işaretleri")
                        .foregroundStyle(.secondary)
                }
                Spacer()
            }
            .padding(.horizontal, 24)
            .padding(.top, 24)
            .padding(.bottom, 12)

            // Filtre bari
            if let vm = viewModel {
                HaritaFiltresiView(viewModel: vm)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 8)
            }

            // Harita
            MapReader { reader in
                Map(position: $kameraKonumu) {
                    if let vm = viewModel {
                        ForEach(vm.filtrelenmisIsaretciler) { isaretci in
                            Annotation(
                                isaretci.baslik,
                                coordinate: CLLocationCoordinate2D(
                                    latitude: isaretci.enlem,
                                    longitude: isaretci.boylam
                                )
                            ) {
                                IsaretciGorunumu(isaretci: isaretci)
                                    .onTapGesture {
                                        secilenIsaretci = isaretci
                                    }
                            }
                        }
                    }
                }
                .mapStyle(.standard(elevation: .realistic))
                .mapControls {
                    MapCompass()
                    MapScaleView()
                    MapZoomStepper()
                }
                .onTapGesture { konum in
                    if let koordinat = reader.convert(konum, from: .local) {
                        yeniKonum = koordinat
                        isaretciEkleGoster = true
                    }
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal, 24)
            .padding(.bottom, 24)

            // Isaretci listesi
            if let vm = viewModel, !vm.filtrelenmisIsaretciler.isEmpty {
                isaretciListesi(vm: vm)
            }
        }
        .sheet(isPresented: $isaretciEkleGoster) {
            if let konum = yeniKonum {
                IsaretciEkleView(koordinat: konum) { baslik, tur, not in
                    viewModel?.isaretciEkle(
                        baslik: baslik,
                        enlem: konum.latitude,
                        boylam: konum.longitude,
                        tur: tur,
                        not: not
                    )
                }
            }
        }
        .sheet(item: $secilenIsaretci) { isaretci in
            IsaretciDetayView(isaretci: isaretci) {
                viewModel?.isaretciSil(isaretci)
                secilenIsaretci = nil
            }
        }
        .onAppear {
            viewModel = HaritaViewModel(modelContext: modelContext, kopek: kopek)
            if let vm = viewModel {
                kameraKonumu = .region(vm.varsayilanBolge)
            }
        }
    }

    @ViewBuilder
    private func isaretciListesi(vm: HaritaViewModel) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(vm.filtrelenmisIsaretciler.prefix(10)) { isaretci in
                    HStack(spacing: 8) {
                        Image(systemName: isaretci.tur.ikon)
                            .foregroundStyle(isaretciRenk(isaretci.tur))
                            .frame(width: 20)

                        VStack(alignment: .leading) {
                            Text(isaretci.baslik)
                                .font(.caption)
                                .fontWeight(.medium)
                            Text(isaretci.tarih.turkceTarih)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(8)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(.background)
                            .shadow(color: .black.opacity(0.05), radius: 2, y: 1)
                    )
                    .onTapGesture {
                        kameraKonumu = .region(MKCoordinateRegion(
                            center: CLLocationCoordinate2D(latitude: isaretci.enlem, longitude: isaretci.boylam),
                            span: MKCoordinateSpan(latitudeDelta: 0.005, longitudeDelta: 0.005)
                        ))
                    }
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 16)
        }
    }

    private func isaretciRenk(_ tur: IsaretciTuru) -> Color {
        switch tur {
        case .yuruyus: return .green
        case .buyukTuvalet: return .brown
        case .kucukTuvalet: return .yellow
        case .favori: return .orange
        case .diger: return .gray
        }
    }
}
