#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOGO="$ROOT/assets/branding/Logo.jpeg"
STORE="$ROOT/store"
ANDROID_RES="$ROOT/android/app/src/main/res"
IOS_ICONSET="$ROOT/ios/GochaApp/Images.xcassets/AppIcon.appiconset"

if ! command -v magick >/dev/null 2>&1 && ! command -v convert >/dev/null 2>&1; then
  echo "ImageMagick is required (magick or convert)." >&2
  exit 1
fi

if [[ ! -f "$LOGO" ]]; then
  echo "Missing logo at $LOGO" >&2
  exit 1
fi

IM() {
  if command -v magick >/dev/null 2>&1; then
    magick "$@"
  else
    convert "$@"
  fi
}

square_icon() {
  local input="$1"
  local output="$2"
  local size="$3"
  IM "$input" -resize "${size}x${size}^" -gravity center -extent "${size}x${size}" "$output"
}

mkdir -p \
  "$STORE/google-play/graphics" \
  "$STORE/apple-app-store/graphics" \
  "$STORE/google-play/screenshots/phone" \
  "$STORE/apple-app-store/screenshots/iphone-6.7" \
  "$ANDROID_RES/mipmap-anydpi-v26" \
  "$ANDROID_RES/values"

declare -A ANDROID_SIZES=(
  [mipmap-mdpi]=48
  [mipmap-hdpi]=72
  [mipmap-xhdpi]=96
  [mipmap-xxhdpi]=144
  [mipmap-xxxhdpi]=192
)

for folder in "${!ANDROID_SIZES[@]}"; do
  size="${ANDROID_SIZES[$folder]}"
  mkdir -p "$ANDROID_RES/$folder"
  square_icon "$LOGO" "$ANDROID_RES/$folder/ic_launcher.png" "$size"
  square_icon "$LOGO" "$ANDROID_RES/$folder/ic_launcher_round.png" "$size"
done

declare -A ANDROID_FOREGROUND=(
  [mipmap-mdpi]=108
  [mipmap-hdpi]=162
  [mipmap-xhdpi]=216
  [mipmap-xxhdpi]=324
  [mipmap-xxxhdpi]=432
)

for folder in "${!ANDROID_FOREGROUND[@]}"; do
  size="${ANDROID_FOREGROUND[$folder]}"
  square_icon "$LOGO" "$ANDROID_RES/$folder/ic_launcher_foreground.png" "$size"
done

cat > "$ANDROID_RES/values/colors.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0B0820</color>
    <color name="splash_background">#0B0820</color>
</resources>
EOF

cat > "$ANDROID_RES/mipmap-anydpi-v26/ic_launcher.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
EOF

cat > "$ANDROID_RES/mipmap-anydpi-v26/ic_launcher_round.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
EOF

square_icon "$LOGO" "$STORE/google-play/graphics/icon-512.png" 512
square_icon "$LOGO" "$STORE/apple-app-store/graphics/app-icon-1024.png" 1024

IM -size 1024x500 \
  "xc:#0B0820" \
  "$LOGO" -resize 360x360 -gravity west -geometry +72+70 -composite \
  -font DejaVu-Sans-Bold -pointsize 72 -fill white -gravity west -annotate +470+190 'Gocha' \
  -font DejaVu-Sans -pointsize 34 -fill '#B8B2FF' -gravity west -annotate +470+290 'Connect. Catch up. Discover.' \
  "$STORE/google-play/graphics/feature-graphic.png"

declare -A IOS_ICONS=(
  [Icon-40.png]=40
  [Icon-60.png]=60
  [Icon-58.png]=58
  [Icon-87.png]=87
  [Icon-80.png]=80
  [Icon-120.png]=120
  [Icon-180.png]=180
  [Icon-1024.png]=1024
)

for file in "${!IOS_ICONS[@]}"; do
  square_icon "$LOGO" "$IOS_ICONSET/$file" "${IOS_ICONS[$file]}"
done

cat > "$IOS_ICONSET/Contents.json" <<'EOF'
{
  "images": [
    { "filename": "Icon-40.png", "idiom": "iphone", "scale": "2x", "size": "20x20" },
    { "filename": "Icon-60.png", "idiom": "iphone", "scale": "3x", "size": "20x20" },
    { "filename": "Icon-58.png", "idiom": "iphone", "scale": "2x", "size": "29x29" },
    { "filename": "Icon-87.png", "idiom": "iphone", "scale": "3x", "size": "29x29" },
    { "filename": "Icon-80.png", "idiom": "iphone", "scale": "2x", "size": "40x40" },
    { "filename": "Icon-120.png", "idiom": "iphone", "scale": "3x", "size": "40x40" },
    { "filename": "Icon-120.png", "idiom": "iphone", "scale": "2x", "size": "60x60" },
    { "filename": "Icon-180.png", "idiom": "iphone", "scale": "3x", "size": "60x60" },
    { "filename": "Icon-1024.png", "idiom": "ios-marketing", "scale": "1x", "size": "1024x1024" }
  ],
  "info": { "author": "xcode", "version": 1 }
}
EOF

echo "Generated native launcher icons and store graphics under $STORE"
