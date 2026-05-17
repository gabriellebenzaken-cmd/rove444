#!/bin/bash
# fix-spm.sh
# Strips ALL CapApp-SPM / Swift Package Manager references from the
# Capacitor-generated Xcode project so CocoaPods can manage everything.
#
# Run from the repo root AFTER `npx cap add ios` and BEFORE `pod install`:
#
#   bash ios/fix-spm.sh

set -e

PBXPROJ="ios/App/App.xcodeproj/project.pbxproj"

if [ ! -f "$PBXPROJ" ]; then
  echo "❌  $PBXPROJ not found. Run 'npx cap add ios' first, then re-run this script."
  exit 1
fi

echo "📄  Backing up $PBXPROJ → ${PBXPROJ}.bak"
cp "$PBXPROJ" "${PBXPROJ}.bak"

# ── Step 1: nuclear line-level removal of everything CapApp-SPM ──────────────
# Catches: package reference lines, product dependency lines, array entries,
# framework embed entries — anything with "CapApp-SPM" on the same line.
sed -i '' '/CapApp-SPM/d' "$PBXPROJ"

# ── Step 2: remove XCRemoteSwiftPackageReference multi-line blocks ────────────
# These look like:
#   DEADBEEF01234567 /* XCRemoteSwiftPackageReference "..." */ = {
#       ...
#   };
perl -i -0pe '
  s/[ \t]+[0-9A-Fa-f]{24}[ \t]+\/\*[ \t]+XCRemoteSwiftPackageReference[^}]*\};\n//gs;
' "$PBXPROJ"

# ── Step 3: remove XCSwiftPackageProductDependency multi-line blocks ──────────
perl -i -0pe '
  s/[ \t]+[0-9A-Fa-f]{24}[ \t]+\/\*[ \t]+XCSwiftPackageProductDependency[^}]*\};\n//gs;
' "$PBXPROJ"

# ── Step 4: strip any remaining packageReferences / packageProductDependencies
#    array sections that now only contain stale UUIDs ─────────────────────────
perl -i -0pe '
  # Empty or UUID-only packageReferences array
  s/\t+packageReferences = \(\n(?:\t+[0-9A-Fa-f]{24}[^\n]*,\n)*\t+\);\n//g;
  # Empty or UUID-only packageProductDependencies array
  s/\t+packageProductDependencies = \(\n(?:\t+[0-9A-Fa-f]{24}[^\n]*,\n)*\t+\);\n//g;
' "$PBXPROJ"

# ── Step 5: remove any dangling UUID-only lines left inside those arrays ──────
# (belt-and-suspenders — normally already gone after steps 1-4)
sed -i '' '/packageReferences\|packageProductDependencies/,/);/{/[0-9A-Fa-f]\{24\}/d;}' "$PBXPROJ"

echo ""
echo "✅  CapApp-SPM references removed from project.pbxproj"
echo ""
echo "══════════════════════════════════════════════"
echo " NEXT STEPS (run in order from repo root)"
echo "══════════════════════════════════════════════"
echo ""
echo "  cd ios/App"
echo "  pod install"
echo "  cd ../.."
echo "  npx cap sync ios"
echo ""
echo "  Then in Xcode:"
echo "  • Open  ios/App/App.xcworkspace  ← the WORKSPACE, NOT .xcodeproj"
echo "  • Product → Clean Build Folder (⇧⌘K)"
echo "  • Run (⌘R)"
echo ""