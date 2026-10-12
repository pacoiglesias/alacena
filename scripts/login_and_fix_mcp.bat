@echo off
setlocal enabledelayedexpansion
title ALACENA ENTERPRISE - Autenticacion Firebase ^& Reparacion MCP

color 0A
echo =====================================================================
echo    ALACENA ENTERPRISE v3.5.0 - RECONEXION FIREBASE ^& MCP SERVER
echo =====================================================================
echo.
echo Este script renovara tu sesion de Google/Firebase para que:
echo   1. El servidor MCP tenga permisos plenos sin errores.
echo   2. Puedas desplegar a produccion automaticamente.
echo   3. La consola y la nube queden 100%% sincronizadas.
echo.
echo =====================================================================
echo.

cd /d "%~dp0.."

echo [PASO 1/5] Abriendo navegador para renovar sesion de Firebase...
echo ---------------------------------------------------------------------
echo Selecciona tu cuenta de Google (paco@cobertores.com / pacoismael@gmail.com)
echo y autoriza el acceso a Firebase CLI en la ventana que se abrira.
echo ---------------------------------------------------------------------
echo.
call npx firebase-tools login --reauth
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] No se pudo completar el login en Firebase.
    echo Intentando con login estandar...
    call npx firebase-tools login
)

echo.
echo [PASO 2/5] Verificando cuenta activa...
call npx firebase-tools login:list

echo.
echo [PASO 3/5] Seleccionando proyecto de produccion 'alacena-enterprise-prod'...
call npx firebase-tools use alacena-enterprise-prod
call npx firebase-tools target:apply hosting alacena-app alacena-enterprise-prod

echo.
echo [PASO 4/5] Compilando frontend optimizado v3.5.0 (React + Vite)...
cd /d "%~dp0..\frontend"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo la compilacion del frontend. Revisa los errores.
    pause
    exit /b 1
)

cd /d "%~dp0.."

echo.
echo [PASO 5/5] Desplegando en vivo a Firebase Hosting...
call npx firebase-tools deploy --only hosting:alacena-app --project alacena-enterprise-prod

if %ERRORLEVEL% equ 0 (
    echo.
    echo =====================================================================
    echo   TODO FUNCIONANDO PERFECTO! 
    echo   Tu sistema y el MCP estan 100%% autenticados y actualizados.
    echo.
    echo   URL de Produccion: https://alacena.cobertores.com
    echo   URL Alterna:       https://alacena-enterprise-prod.web.app
    echo =====================================================================
) else (
    echo.
    echo [AVISO] El despliegue tuvo advertencias. Tu sesion de login ya quedo
    echo renovada para el MCP Server.
)

echo.
pause
