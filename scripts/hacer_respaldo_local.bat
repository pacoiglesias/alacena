@echo off
setlocal
echo ============================================================
echo   ALACENA ENTERPRISE - EJECUTANDO RESPALDO LOCAL
echo ============================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0hacer_respaldo_local.ps1"
echo ============================================================
pause
