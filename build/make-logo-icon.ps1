# 从 public/logo.png 生成三端图标:
#   1. public/favicon.ico —— 网站图标(16/32/48/64/128/256 多尺寸)
#   2. build/icon.png + build/icon.ico —— Electron exe 打包图标
#   3. android mipmap-* 启动图标(方形/圆形/自适应前景)
$ErrorActionPreference = 'Stop'
try {
Add-Type -AssemblyName System.Drawing

$root = 'D:\Ikarows\color-vision-test'
$src = [System.Drawing.Image]::FromFile("$root\public\logo.png")

# 高质量缩放到 n x n(边缘 TileFlipXY 消除双三次插值白边)
function New-Sized([System.Drawing.Image]$img, [int]$n) {
  $bmp = New-Object System.Drawing.Bitmap($n, $n, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  $ia = New-Object System.Drawing.Imaging.ImageAttributes
  $ia.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
  $rect = New-Object System.Drawing.Rectangle(0, 0, $n, $n)
  $g.DrawImage($img, $rect, 0, 0, $img.Width, $img.Height, [System.Drawing.GraphicsUnit]::Pixel, $ia)
  $g.Dispose(); $ia.Dispose()
  return , $bmp
}

# ---------- 1. 多尺寸 ICO(经典 BMP/DIB 条目,兼容性最好) ----------
$sizes = @(16, 32, 48, 64, 128, 256)
$dibs = @()
foreach ($n in $sizes) {
  $bmp = New-Sized $src $n
  $rect = New-Object System.Drawing.Rectangle(0, 0, $n, $n)
  $ld = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $stride = $ld.Stride
  $raw = New-Object byte[] ($stride * $n)
  [System.Runtime.InteropServices.Marshal]::Copy($ld.Scan0, $raw, 0, $raw.Length)
  $bmp.UnlockBits($ld)
  $bmp.Dispose()

  # ICO 内嵌 DIB:BITMAPINFOHEADER(高度 x2) + 自底向上 BGRA 像素 + 全 0 AND 掩码
  $xorLen = 4 * $n * $n
  $maskRow = ([int][math]::Ceiling($n / 32)) * 4
  $andLen = $maskRow * $n
  $dib = New-Object byte[] (40 + $xorLen + $andLen)

  $dib[0] = 40
  [BitConverter]::GetBytes([int]$n).CopyTo($dib, 4)                 # biWidth
  [BitConverter]::GetBytes([int]($n * 2)).CopyTo($dib, 8)           # biHeight(x2: XOR+AND)
  [BitConverter]::GetBytes([uint16]1).CopyTo($dib, 12)              # biPlanes
  [BitConverter]::GetBytes([uint16]32).CopyTo($dib, 14)             # biBitCount
  [BitConverter]::GetBytes([int]($xorLen + $andLen)).CopyTo($dib, 20) # biSizeImage

  $rowBytes = 4 * $n
  for ($y = 0; $y -lt $n; $y++) {
    [Array]::Copy($raw, $y * $stride, $dib, 40 + ($n - 1 - $y) * $rowBytes, $rowBytes)
  }
  $dibs += , $dib
}

$ms = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($ms)
$bw.Write([uint16]0); $bw.Write([uint16]1); $bw.Write([uint16]$sizes.Count)  # ICONDIR
$offset = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
  $n = $sizes[$i]
  $dim = if ($n -ge 256) { 0 } else { $n }  # 256 写 0
  $bw.Write([byte]$dim); $bw.Write([byte]$dim)
  $bw.Write([byte]0); $bw.Write([byte]0)
  $bw.Write([uint16]1); $bw.Write([uint16]32)
  $bw.Write([int]$dibs[$i].Length)
  $bw.Write([int]$offset)
  $offset += $dibs[$i].Length
}
foreach ($d in $dibs) { $bw.Write($d) }
$bw.Flush()
$icoBytes = $ms.ToArray()
[System.IO.File]::WriteAllBytes("$root\public\favicon.ico", $icoBytes)
[System.IO.File]::WriteAllBytes("$root\build\icon.ico", $icoBytes)
$bw.Dispose(); $ms.Dispose()

# ---------- 2. build/icon.png(1024,electron-builder 兜底图标源) ----------
$big = New-Sized $src 1024
$big.Save("$root\build\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$big.Dispose()

# ---------- 3. Android 启动图标 ----------
$keys = @('mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi')
$lens = @(48, 72, 96, 144, 192)
for ($i = 0; $i -lt 5; $i++) {
  $n = $lens[$i]
  $dir = "$root\android\app\src\main\res\mipmap-" + $keys[$i]
  $dst = New-Sized $src $n
  $dst.Save("$dir\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $dst.Save("$dir\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $dst.Dispose()
}
# 自适应图标前景:108dp 画布,内容居中占约 2/3(安全区)
$flens = @(108, 162, 216, 324, 432)
for ($i = 0; $i -lt 5; $i++) {
  $n = $flens[$i]
  $dir = "$root\android\app\src\main\res\mipmap-" + $keys[$i]
  $fg = New-Object System.Drawing.Bitmap($n, $n, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $gf = [System.Drawing.Graphics]::FromImage($fg)
  $gf.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $gf.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $gf.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $gf.Clear([System.Drawing.Color]::Transparent)
  $inset = [int][math]::Round($n * 0.24)
  $inner = [int]($n - ($inset * 2))
  $ia = New-Object System.Drawing.Imaging.ImageAttributes
  $ia.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
  $destRect = New-Object System.Drawing.Rectangle($inset, $inset, $inner, $inner)
  $gf.DrawImage($src, $destRect, 0, 0, $src.Width, $src.Height, [System.Drawing.GraphicsUnit]::Pixel, $ia)
  $gf.Dispose(); $ia.Dispose()
  $fg.Save("$dir\ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $fg.Dispose()
}
$src.Dispose()
Write-Output "done: favicon.ico $((Get-Item "$root\public\favicon.ico").Length) bytes"
} catch {
  Write-Output "ERROR line $($_.InvocationInfo.ScriptLineNumber): $($_.Exception.Message)"
  exit 1
}
