// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "PuppyTimer",
    platforms: [
        .macOS(.v14)
    ],
    dependencies: [
        // Firebase iOS SDK — macOS 14+ destekler
        .package(
            url: "https://github.com/firebase/firebase-ios-sdk.git",
            from: "11.0.0"
        )
    ],
    targets: [
        .executableTarget(
            name: "PuppyTimer",
            dependencies: [
                .product(name: "FirebaseFirestore", package: "firebase-ios-sdk"),
                .product(name: "FirebaseAuth",      package: "firebase-ios-sdk"),
                .product(name: "FirebaseFunctions",  package: "firebase-ios-sdk"),
                .product(name: "FirebaseMessaging",  package: "firebase-ios-sdk"),
            ],
            path: "PuppyTimer"
        )
    ]
)
