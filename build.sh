#!/bin/bash
# iOS Build Script for PuppyTimer
# Usage: ./build.sh [simulator|device|archive]

set -e

TARGET="${1:-simulator}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${PROJECT_DIR}/build"
DERIVED_DATA="${BUILD_DIR}/DerivedData"

echo "🐕 PuppyTimer iOS Build Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

cd "$PROJECT_DIR"

case "$TARGET" in
    simulator)
        echo "📱 Building for iPhone Simulator..."
        xcodebuild build \
            -scheme PuppyTimer \
            -sdk iphonesimulator \
            -configuration Debug \
            -xcconfig XCBuildConfig.xcconfig \
            -derivedDataPath "$DERIVED_DATA" \
            -verbose
        echo "✅ Simulator build completed!"
        echo "📁 Build artifacts: $BUILD_DIR"
        ;;

    device)
        echo "🍎 Building for iOS Device..."
        echo "⚠️  Requires: Apple Developer Account, valid provisioning profile"
        xcodebuild build \
            -scheme PuppyTimer \
            -sdk iphoneos \
            -configuration Debug \
            -xcconfig XCBuildConfig.xcconfig \
            -derivedDataPath "$DERIVED_DATA"
        echo "✅ Device build completed!"
        ;;

    archive)
        echo "📦 Creating Archive for App Store..."
        ARCHIVE_PATH="${BUILD_DIR}/PuppyTimer.xcarchive"

        xcodebuild archive \
            -scheme PuppyTimer \
            -sdk iphoneos \
            -configuration Release \
            -xcconfig XCBuildConfig.xcconfig \
            -derivedDataPath "$DERIVED_DATA" \
            -archivePath "$ARCHIVE_PATH" \
            -verbose

        echo "✅ Archive created: $ARCHIVE_PATH"
        echo ""
        echo "🔗 Next step: Export for TestFlight"
        echo "   Run: ./build.sh export"
        ;;

    export)
        echo "📤 Exporting Archive for TestFlight..."
        ARCHIVE_PATH="${BUILD_DIR}/PuppyTimer.xcarchive"
        EXPORT_PATH="${BUILD_DIR}/Export"

        if [ ! -d "$ARCHIVE_PATH" ]; then
            echo "❌ Archive not found: $ARCHIVE_PATH"
            echo "   First run: ./build.sh archive"
            exit 1
        fi

        # Check if ExportOptions.plist has valid Team ID
        if grep -q "REPLACE_WITH_YOUR_TEAM_ID" ExportOptions.plist; then
            echo "❌ ERROR: ExportOptions.plist has invalid Team ID"
            echo "   Please replace 'REPLACE_WITH_YOUR_TEAM_ID' with your actual Team ID"
            echo "   Find it at: https://appstoreconnect.apple.com/ → Membership Details"
            exit 1
        fi

        xcodebuild -exportArchive \
            -archivePath "$ARCHIVE_PATH" \
            -exportOptionsPlist ExportOptions.plist \
            -exportPath "$EXPORT_PATH" \
            -verbose

        IPA_PATH="${EXPORT_PATH}/PuppyTimer.ipa"
        if [ -f "$IPA_PATH" ]; then
            echo "✅ Export completed!"
            echo "📦 IPA file: $IPA_PATH"
            echo ""
            echo "🔗 Next step: Upload to App Store Connect"
            echo "   Using Xcode Organizer or Transporter"
        else
            echo "❌ Export failed: IPA file not found"
            exit 1
        fi
        ;;

    *)
        echo "❌ Unknown target: $TARGET"
        echo ""
        echo "Usage: ./build.sh [simulator|device|archive|export]"
        echo ""
        echo "Examples:"
        echo "  ./build.sh simulator  # Build for Simulator (Debug)"
        echo "  ./build.sh device     # Build for Device (Debug)"
        echo "  ./build.sh archive    # Create Archive (Release)"
        echo "  ./build.sh export     # Export Archive as IPA (TestFlight)"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Build process completed!"
