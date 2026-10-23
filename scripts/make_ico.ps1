Add-Type -AssemblyName System.Drawing
$srcPath = Join-Path $PSScriptRoot "..\src\icon.jpg"
$destDir = Join-Path $PSScriptRoot "..\build"
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}
$destPath = Join-Path $destDir "icon.ico"

$img = [System.Drawing.Image]::FromFile($srcPath)
$bmp = New-Object System.Drawing.Bitmap($img, 256, 256)
$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream($destPath, [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$bmp.Dispose()
$img.Dispose()
Write-Output "ICO_SUCCESS"
