@echo off
setlocal enabledelayedexpansion
title Reparar Errores MCP - Antigravity IDE

color 0B
echo =====================================================================
echo       ANTIGRAVITY IDE - REPARADOR DE SERVIDORES MCP
echo =====================================================================
echo.
echo Este script elimina los errores de inicio en el IDE:
echo  1. github-mcp-server: exec "docker": executable file not found
echo  2. data-agent-kit / notebooks / visualization: connect ENOENT pipe
echo  3. datacloud_gcs_remote / logging / audit: oauth2 invalid_grant (invalid_rapt)
echo.
echo Preserva intactos los servidores de tu entorno de trabajo:
echo  - firebase-mcp-server (Firebase Hosting, Firestore, Auth)
echo  - dart-mcp-server (Flutter / Dart)
echo  - cloudrun
echo.
echo =====================================================================
echo   [1] Reparar y limpiar errores de MCP (Recomendado)
echo   [2] Reparar y ademas reautenticar Google Cloud (gcloud login)
echo   [3] Restaurar copia de seguridad anterior (mcp_config.json.bak)
echo   [4] Salir
echo =====================================================================
echo.

set /p OPCION="Elige una opcion [1-4] (Por defecto 1): "
if "%OPCION%"=="" set OPCION=1

if "%OPCION%"=="1" goto REPARAR
if "%OPCION%"=="2" goto REPARAR_Y_REAUTH
if "%OPCION%"=="3" goto RESTAURAR
if "%OPCION%"=="4" goto FIN

:REPARAR
echo.
echo Ejecutando limpieza de servidores MCP incompatibles...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix_mcp_config.ps1"
goto FINALIZADO

:REPARAR_Y_REAUTH
echo.
echo Ejecutando limpieza y reautenticacion de Google Cloud...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix_mcp_config.ps1" -ReauthGCP
goto FINALIZADO

:RESTAURAR
echo.
echo Restaurando copia de seguridad...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix_mcp_config.ps1" -RestoreBackup
goto FINALIZADO

:FINALIZADO
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
exit /b 0

:FIN
exit /b 0
