@echo off
setlocal enabledelayedexpansion
title ALACENA - Configuracion de Firebase y Hosting

echo =====================================================================
echo       ALACENA ENTERPRISE - CONFIGURACION FIREBASE ^& HOSTING
echo =====================================================================
echo.

set "ROOT_DIR=%~dp0.."
cd /d "%ROOT_DIR%"

:: 1. Verificar sesion en Firebase
echo [*] Verificando autenticacion en Firebase...
call firebase login:list >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [*] Se requiere iniciar sesion en Firebase CLI. Abriendo navegador...
    call firebase login
) else (
    echo [OK] Sesion activa en Firebase CLI.
)

:: 2. Preguntar o confirmar el ID del Proyecto Firebase
echo.
echo =====================================================================
echo Configurar Proyecto Firebase
echo =====================================================================
set /p FIREBASE_PROJECT="Ingresa tu Firebase Project ID (o Enter para listar tus proyectos): "
if "!FIREBASE_PROJECT!"=="" (
    call firebase projects:list
    set /p FIREBASE_PROJECT="Ahora ingresa el Project ID seleccionado: "
)

if not "!FIREBASE_PROJECT!"=="" (
    echo [*] Vinculando proyecto: !FIREBASE_PROJECT!
    call firebase use --add !FIREBASE_PROJECT!
)

:: 3. Configurar Hosting Target para alacena.cobertores.com
echo.
echo [*] Configurando Target de Hosting para dominio: alacena.cobertores.com ...
echo     Target: alacena-app
set /p HOSTING_SITE="Ingresa el nombre del Hosting Site en Firebase Console (Default es el mismo Project ID): "
if "!HOSTING_SITE!"=="" set "HOSTING_SITE=!FIREBASE_PROJECT!"

call firebase target:apply hosting alacena-app !HOSTING_SITE!
if %ERRORLEVEL% equ 0 (
    echo [OK] Target de hosting 'alacena-app' vinculado a '!HOSTING_SITE!'.
) else (
    echo [AVISO] No se pudo aplicar el target directamente. Verifica si el site existe en Firebase Console.
)

echo.
echo =====================================================================
echo [OK] Fase 0.3 completada: Firebase CLI y Targets configurados.
echo =====================================================================
exit /b 0
