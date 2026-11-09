#!/usr/bin/env bash
# Sign (ad-hoc when forge signing is inactive), then build DMG + update zip.
# Called from package.json bundle scripts and again by notarize-macos.sh
# after stapling, so release artifacts carry the stapled app.
set -euo pipefail

arch="${1:?usage: package-macos.sh <arm64|x64>}"
BUNDLE_NAME="${GOOSE_BUNDLE_NAME:-10Router}"
APP_DIR="out/${BUNDLE_NAME}-darwin-${arch}"
APP_BUNDLE="${APP_DIR}/${BUNDLE_NAME}.app"
VERSION="$(node -p "require('./package.json').version")"

# codesign -dv prints "TeamIdentifier=not set" for ad-hoc signatures and an
# actual team ID for real ones; newer codesign versions omit the Authority=
# lines, so keying on TeamIdentifier works across macOS versions.
TEAM="$(codesign -dv "$APP_BUNDLE" 2>&1 | grep -m1 '^TeamIdentifier=')"
if [ -n "$TEAM" ] && [ "$TEAM" != "TeamIdentifier=not set" ]; then
  echo "App already carries a Developer ID signature ($TEAM), keeping it"
else
  codesign --force --deep --sign - "$APP_BUNDLE"
fi
codesign --verify --deep --strict "$APP_BUNDLE"

STAGING="out/dmg-staging-${arch}"
rm -rf "$STAGING"
mkdir -p "$STAGING"
cp -R "$APP_BUNDLE" "$STAGING/"
ln -s /Applications "$STAGING/Applications"
mkdir -p out/make
hdiutil create -volname "${BUNDLE_NAME}" -srcfolder "$STAGING" -ov -format ULFO "out/make/${BUNDLE_NAME}-${VERSION}-${arch}.dmg"

if [ "$arch" = "arm64" ]; then
  ZIP_NAME="${BUNDLE_NAME}.zip"
else
  ZIP_NAME="${BUNDLE_NAME}_intel_mac.zip"
fi
(cd "$APP_DIR" && ditto -c -k --keepParent "${BUNDLE_NAME}.app" "$ZIP_NAME")
