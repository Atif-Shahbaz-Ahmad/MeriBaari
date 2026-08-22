# Sync MeriBaari brand icons from desktop/Tauri assets into Expo mobile assets.
# Run before `npm run android:apk` so the APK launcher icon and splash are correct.

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$srcIcon = Join-Path $root 'desktop\src-tauri\icons\icon.png'
$srcForeground = Join-Path $root 'desktop\src-tauri\icons\android\mipmap-xxxhdpi\ic_launcher_foreground.png'
$outDir = Join-Path $root 'assets\images'

function Save-Bitmap($bitmap, $path) {
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Resize-Png {
  param(
    [string]$Source,
    [string]$Destination,
    [int]$Size
  )
  $img = [System.Drawing.Image]::FromFile($Source)
  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.DrawImage($img, 0, 0, $Size, $Size)
  Save-Bitmap $bmp $Destination
  $g.Dispose()
  $bmp.Dispose()
  $img.Dispose()
}

function New-SolidPng {
  param(
    [string]$Destination,
    [int]$Size,
    [string]$Hex
  )
  $color = [System.Drawing.ColorTranslator]::FromHtml($Hex)
  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear($color)
  Save-Bitmap $bmp $Destination
  $g.Dispose()
  $bmp.Dispose()
}

if (-not (Test-Path $srcIcon)) {
  throw "Missing source icon: $srcIcon"
}
if (-not (Test-Path $srcForeground)) {
  throw "Missing source foreground: $srcForeground"
}

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Resize-Png -Source $srcIcon -Destination (Join-Path $outDir 'icon.png') -Size 1024
Resize-Png -Source $srcIcon -Destination (Join-Path $outDir 'splash-icon.png') -Size 512
Resize-Png -Source $srcForeground -Destination (Join-Path $outDir 'android-icon-foreground.png') -Size 1024
New-SolidPng -Destination (Join-Path $outDir 'android-icon-background.png') -Size 1024 -Hex '#2563EB'
Resize-Png -Source $srcForeground -Destination (Join-Path $outDir 'android-icon-monochrome.png') -Size 1024
Resize-Png -Source $srcIcon -Destination (Join-Path $outDir 'favicon.png') -Size 48

Write-Host "Updated mobile brand assets in $outDir"
