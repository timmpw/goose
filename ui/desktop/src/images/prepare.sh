#!/usr/bin/env sh
# Regenerate platform icons from the raster masters.
# Masters: icon.png (1024x1024), icon@2x.png (2048x2048),
# iconTemplate@2x.png / iconTemplateUpdate@2x.png (44x44 menu bar glyphs).
# SVG files are design references only — ImageMagick's built-in SVG renderer
# drops url(#...) gradients, so icons are resized from the raster masters instead.
# Requires ImageMagick (magick) and iconutil (macOS).

set -e

# Menu bar template icons
magick iconTemplate@2x.png -resize 22x22 iconTemplate.png
magick iconTemplateUpdate@2x.png -resize 22x22 iconTemplateUpdate.png

# Flatpak icon
magick icon.png -resize 512x512 icon-512.png

# Windows icon (multiple sizes in one file)
magick icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# macOS icon set
mkdir -p icon.iconset
magick icon.png -resize 16x16 icon.iconset/icon_16x16.png
magick icon.png -resize 32x32 icon.iconset/icon_16x16@2x.png
magick icon.png -resize 32x32 icon.iconset/icon_32x32.png
magick icon.png -resize 64x64 icon.iconset/icon_32x32@2x.png
magick icon.png -resize 128x128 icon.iconset/icon_128x128.png
magick icon.png -resize 256x256 icon.iconset/icon_128x128@2x.png
magick icon.png -resize 256x256 icon.iconset/icon_256x256.png
magick icon.png -resize 512x512 icon.iconset/icon_256x256@2x.png
magick icon.png -resize 512x512 icon.iconset/icon_512x512.png
magick icon.png -resize 1024x1024 icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
rm -rf icon.iconset
