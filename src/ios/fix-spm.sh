#!/bin/bash
# fix-spm.sh
# Strips the stale CapApp-SPM Swift Package Manager reference from the
# generated Xcode project so CocoaPods can take over cleanly.
#
# Run once from the repo root AFTER `npx cap add ios` and BEFORE `pod install`:
#
#   bash ios/fix-spm.sh

set -e

PBXPROJ="ios/App/App.xcodeproj/project.pbxproj"

if [ ! -f "$PBXPROJ" ]; then
  echo "❌  $PBXPROJ not found. Run 'npx cap add ios' first."
  exit 1
fi

echo "📄  Backing up $PBXPROJ → ${PBXPROJ}.bak"
cp "$PBXPROJ" "${PBXPROJ}.bak"

# 1. Remove every line that mentions CapApp-SPM (package reference, product
#    reference, and dependency entries).
sed -i '' '/CapApp-SPM/d' "$PBXPROJ"

# 2. Remove XCRemoteSwiftPackageReference blocks (the full multi-line block
#    that Capacitor adds for its SPM package).
#    perl handles multi-line deletion cleanly.
perl -i -0pe 's/\t+[A-F0-9]{24} \/\* XCRemoteSwiftPackageReference[^}]+\};\n//g' "$PBXPROJ"

# 3. Remove XCSwiftPackageProductDependency blocks.
perl -i -0pe 's/\t+[A-F0-9]{24} \/\* XCSwiftPackageProductDependency[^}]+\};\n//g' "$PBXPROJ"

# 4. Clean up any dangling references in the packageReferences or
#    packageProductDependencies arrays (lines that are just a hex UUID + comment).
sed -i '' '/packageReferences\|packageProductDependencies/,/);/{/[A-F0-9]\{24\}/d}' "$PBXPROJ"

echo "✅  CapApp-SPM references removed from $PBXPROJ"
echo ""
echo "Next steps:"
echo "  cd ios/App && pod install && cd ../.."
echo "  npx cap sync ios"
echo "  open ios/App/App.xcworkspace"