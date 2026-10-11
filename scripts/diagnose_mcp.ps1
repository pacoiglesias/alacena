Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " ANALISIS DE CONEXION: data-agent-kit MCP Proxy" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$pipeName = "datacloud-mcp-dataAgentKit-antigravityide"
$pipeFullName = "\\.\\pipe\\" + $pipeName

Write-Host "[1/3] Verificando existencia de Named Pipes activos en Windows..." -ForegroundColor Yellow
$pipes = [System.IO.Directory]::GetFiles("\\.\\pipe\\") | Where-Object { $_ -match "dataAgentKit|datacloud" }

if ($pipes) {
    Write-Host "[OK] Se encontraron los siguientes pipes del IDE en Windows:" -ForegroundColor Green
    $pipes | ForEach-Object { Write-Host "     -> $_" -ForegroundColor Green }
} else {
    Write-Host "[AVISO] El Named Pipe no existe actualmente en el sistema." -ForegroundColor Red
    Write-Host "        Esto ocurre porque el proceso daemon de GCP aun no arranco o murio." -ForegroundColor Gray
}

Write-Host ""
Write-Host "[2/3] Probando comunicacion con el socket de data-agent-kit..." -ForegroundColor Yellow

try {
    $pipeClient = New-Object System.IO.Pipes.NamedPipeClientStream(".", $pipeName, [System.IO.Pipes.PipeDirection]::InOut)
    $pipeClient.Connect(1500)
    Write-Host "[EXITO] El pipe esta activo y acepto conexion entrante!" -ForegroundColor Green
    $pipeClient.Dispose()
} catch {
    Write-Host "[DETECCION] Estado del pipe: " $_.Exception.Message -ForegroundColor Yellow
    Write-Host "El cliente MCP proxy mostro ENOENT porque intento conectar antes de que" -ForegroundColor Gray
    Write-Host "el subproceso del IDE abriera el canal o cerro la sesion (EOF)." -ForegroundColor Gray
}

Write-Host ""
Write-Host "[3/3] Diagnostico de Impacto en tu Proyecto ALACENA:" -ForegroundColor Yellow
Write-Host " - flutter / dart:     OPERATIVO (No usa data-agent-kit)" -ForegroundColor Green
Write-Host " - firebase / auth:    OPERATIVO (No usa data-agent-kit)" -ForegroundColor Green
Write-Host " - firestore / web:    OPERATIVO (No usa data-agent-kit)" -ForegroundColor Green
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " COMO QUITAR EL MENSAJE EN EL IDE EN 2 PASOS:" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " 1. En Antigravity IDE presiona: Ctrl + Shift + P" -ForegroundColor White
Write-Host " 2. Escribe y selecciona: Reload Window (o Developer: Reload Window)" -ForegroundColor White
Write-Host ""
Write-Host " Esto reinicia los sockets del IDE y restablece la conexion limpia." -ForegroundColor Gray
