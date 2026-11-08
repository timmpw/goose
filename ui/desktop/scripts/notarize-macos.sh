#!/usr/bin/env bash
# Notarize a forge-signed app, staple it, rebuild DMG + update zip from the
# stapled app, then sign + notarize + staple the DMG itself.
# Requires: app built with APPLE_TEAM_ID set (forge osxSign), and a notarytool
# keychain profile (MACOS_NOTARY_PROFILE, default "notary-profile").
set -euo pipefail

arch="${1:?usage: notarize-macos.sh <arm64|x64>}"
profile="${MACOS_NOTARY_PROFILE:-notary-profile}"
identity="${MACOS_SIGNING_IDENTITY:-${APPLE_TEAM_ID:?set APPLE_TEAM_ID or MACOS_SIGNING_IDENTITY}}"
if [ -n "${MACOS_NOTARY_KEYCHAIN:-}" ]; then
  keychain_args=(--keychain "$MACOS_NOTARY_KEYCHAIN")
else
  keychain_args=()
fi
BUNDLE_NAME="${GOOSE_BUNDLE_NAME:-10Router}"
APP_DIR="out/${BUNDLE_NAME}-darwin-${arch}"
APP="${APP_DIR}/${BUNDLE_NAME}.app"
VERSION="$(node -p "require('./package.json').version")"
DMG="out/make/${BUNDLE_NAME}-${VERSION}-${arch}.dmg"

codesign -dv "$APP" 2>&1 | grep -q "Authority=Developer ID Application" || {
  echo "App is not Developer ID signed; build with APPLE_TEAM_ID set" >&2
  exit 1
}

echo "==> Notarizing app"
NOTARIZE_ZIP="out/${BUNDLE_NAME}-notarize-${arch}.zip"
(cd "$APP_DIR" && ditto -c -k --sequesterRsrc --keepParent "${BUNDLE_NAME}.app" "../$(basename "$NOTARIZE_ZIP")")
xcrun notarytool submit "$NOTARIZE_ZIP" --keychain-profile "$profile" "${keychain_args[@]}" --wait
rm -f "$NOTARIZE_ZIP"

echo "==> Stapling app"
xcrun stapler staple "$APP"

echo "==> Rebuilding DMG and update zip from stapled app"
bash scripts/package-macos.sh "$arch"

echo "==> Signing, notarizing, stapling DMG"
codesign --force --timestamp --sign "$identity" "$DMG"
xcrun notarytool submit "$DMG" --keychain-profile "$profile" "${keychain_args[@]}" --wait
xcrun stapler staple "$DMG"

echo "==> Gatekeeper verdicts"
spctl -a -t open --context context:primary-signature -v "$APP"
spctl -a -t open --context context:primary-signature -v "$DMG"
