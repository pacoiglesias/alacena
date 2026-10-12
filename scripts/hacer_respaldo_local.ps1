param(
    [string]$DestinationDir = "c:\Users\pacoi\ALACENA\backups"
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
if (!(Test-Path -Path $DestinationDir)) {
    New-Item -ItemType Directory -Path $DestinationDir -Force | Out-Null
}

$zipName = "ALACENA_backup_${timestamp}_v3.5.3.zip"
$zipPath = Join-Path -Path $DestinationDir -ChildPath $zipName

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ALACENA ENTERPRISE - GENERADOR DE RESPALDO LOCAL" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Destino: $zipPath"

$excludePatterns = @(
    "\\node_modules\\", "\\node_modules$",
    "\\.dart_tool\\", "\\.dart_tool$",
    "\\build\\", "\\build$",
    "\\.firebase\\", "\\.firebase$",
    "\\.git\\", "\\.git$",
    "\\dist\\", "\\dist$",
    "\\backups\\", "\\backups$"
)

$sourceDir = "c:\Users\pacoi\ALACENA"
$itemsToCompress = Get-ChildItem -Path $sourceDir -Recurse | Where-Object {
    $full = $_.FullName
    $skip = $false
    foreach ($pattern in $excludePatterns) {
        if ($full -match $pattern) {
            $skip = $true
            break
        }
    }
    -not $skip
}

Write-Host "Comprimiendo $($itemsToCompress.Count) archivos y carpetas..." -ForegroundColor Yellow

$tempFolder = Join-Path -Path $env:TEMP -ChildPath "alacena_bk_$timestamp"
if (Test-Path -Path $tempFolder) { Remove-Item -Path $tempFolder -Recurse -Force }
New-Item -ItemType Directory -Path $tempFolder -Force | Out-Null

# Copiar archivos preservando estructura
foreach ($item in $itemsToCompress) {
    if (-not $item.PSIsContainer) {
        $relativePath = $item.FullName.Substring($sourceDir.Length).TrimStart('\', '/')
        $targetFile = Join-Path -Path $tempFolder -ChildPath $relativePath
        $targetDir = Split-Path -Path $targetFile -Parent
        if (!(Test-Path -Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        Copy-Item -Path $item.FullName -Destination $targetFile -Force
    }
}

Compress-Archive -Path "$tempFolder\*" -DestinationPath $zipPath -CompressionLevel Optimal -Force
Remove-Item -Path $tempFolder -Recurse -Force

if (Test-Path -Path $zipPath) {
    $sizeMb = ((Get-Item -Path $zipPath).Length / 1MB).ToString("F2")
    Write-Host "Respaldo local generado con exito: $zipPath ($sizeMb MB)" -ForegroundColor Green
} else {
    Write-Error "Fallo la creacion del respaldo."
}
