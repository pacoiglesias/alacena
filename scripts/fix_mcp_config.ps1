# Script de reparacion y limpieza de MCP Servers para Antigravity IDE
param(
    [switch]$ReauthGCP = $false,
    [switch]$RestoreBackup = $false
)

$configPath = "C:\Users\pacoi\.gemini\config\mcp_config.json"
$backupPath = "C:\Users\pacoi\.gemini\config\mcp_config.json.bak"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "        REPARADOR DE SERVIDORES MCP - ANTIGRAVITY IDE           " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

if ($RestoreBackup) {
    if (Test-Path $backupPath) {
        Copy-Item -Path $backupPath -Destination $configPath -Force
        Write-Host "[OK] Backup restaurado exitosamente desde $backupPath" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] No se encontro archivo de backup en $backupPath" -ForegroundColor Red
    }
    exit 0
}

if (-not (Test-Path $configPath)) {
    Write-Host "[ERROR] No se encontro el archivo de configuracion en: $configPath" -ForegroundColor Red
    exit 1
}

# 1. Crear copia de seguridad
Copy-Item -Path $configPath -Destination $backupPath -Force
Write-Host "[1/3] Copia de seguridad guardada en: $backupPath" -ForegroundColor Green

# 2. Leer configuracion actual
try {
    $content = Get-Content -Path $configPath -Raw -Encoding UTF8
    $json = $content | ConvertFrom-Json
} catch {
    Write-Host "[ERROR] No se pudo leer o parsear el JSON de configuracion: $_" -ForegroundColor Red
    exit 1
}

# Lista de servidores que generan errores recurrentes si no estan activos:
# - github-mcp-server: Requiere Docker (no instalado en Windows)
# - notebooks, visualization, data-agent-kit: Requieren named pipes locales de Datacloud extension
# - google-cloud-audit-manager-us-central1, google-cloud-logging, datacloud_gcs_remote: Dan error invalid_grant/invalid_rapt por sesion expirada
$problematicServers = @(
    "github-mcp-server",
    "notebooks",
    "visualization",
    "data-agent-kit",
    "google-cloud-audit-manager-us-central1",
    "google-cloud-logging",
    "datacloud_gcs_remote",
    "datacloud_bigquery_remote",
    "datacloud_knowledge_catalog_remote",
    "google-cloud-firestore"
)

Write-Host "[2/3] Removiendo servidores MCP incompatibles/rotos..." -ForegroundColor Yellow

$removed = @()
foreach ($srv in $problematicServers) {
    if ($json.mcpServers.PSObject.Properties[$srv]) {
        $json.mcpServers.PSObject.Properties.Remove($srv)
        $removed += $srv
        Write-Host "      [-] Removido: $srv" -ForegroundColor Magenta
    }
}

if ($removed.Count -eq 0) {
    Write-Host "      [INFO] Los servidores con error ya habian sido removidos previamente." -ForegroundColor Gray
} else {
    # Guardar JSON actualizado
    $newJson = $json | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($configPath, $newJson, [System.Text.Encoding]::UTF8)
    Write-Host "[OK] Configuracion actualizada con exito sin servidores rotos." -ForegroundColor Green
}

# 3. Mostrar servidores conservados
Write-Host ""
Write-Host "[3/3] Servidores MCP activos y operativos:" -ForegroundColor Cyan
foreach ($prop in $json.mcpServers.PSObject.Properties) {
    Write-Host "      [+] $($prop.Name)" -ForegroundColor Green
}

if ($ReauthGCP) {
    Write-Host ""
    Write-Host "=================================================================" -ForegroundColor Yellow
    Write-Host " REAUTENTICANDO GOOGLE CLOUD SDK (ADC)..." -ForegroundColor Yellow
    Write-Host "=================================================================" -ForegroundColor Yellow
    & gcloud auth application-default login
}

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " REPARACION COMPLETADA!" -ForegroundColor Green
Write-Host " Para aplicar los cambios en Antigravity IDE:" -ForegroundColor White
Write-Host "   1. Presiona: Ctrl + Shift + P" -ForegroundColor White
Write-Host "   2. Escribe y ejecuta: Developer: Reload Window" -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Cyan
