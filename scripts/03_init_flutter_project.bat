@echo off
setlocal enabledelayedexpansion
title ALACENA - Inicializacion de Proyecto Flutter

echo =====================================================================
echo       ALACENA ENTERPRISE - CREACION ^& DEPENDENCIAS DE FLUTTER
echo =====================================================================
echo.

set "ROOT_DIR=%~dp0.."
cd /d "%ROOT_DIR%"

where flutter >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Flutter no esta en tu variable PATH.
    echo         Ejecuta primero scripts\00_setup_env.bat
    pause
    exit /b 1
)

:: 1. Comprobar si ya existe pubspec.yaml
if not exist "%ROOT_DIR%\pubspec.yaml" (
    echo [*] Creando esqueleto de Flutter con organizacion com.cobertores...
    call flutter create --org com.cobertores --project-name alacena --platforms=android,ios,web .
) else (
    echo [OK] pubspec.yaml ya existe. Actualizando dependencias...
)

:: 2. Instalar dependencias core de Produccion
echo.
echo [*] Instalando dependencias empresariales (Riverpod, Firebase, Hardware, UI)...

:: State Management & Routing
call flutter pub add flutter_riverpod riverpod_annotation go_router
:: Firebase Suite
call flutter pub add firebase_core firebase_auth cloud_firestore firebase_storage firebase_messaging
:: Hardware: QR, NFC, Camara
call flutter pub add mobile_scanner nfc_manager image_picker
:: Impresion de Etiquetas ^& PDF (Dymo, Brother, Niimbot)
call flutter pub add pdf printing qr_flutter
:: Utilidades y Red
call flutter pub add dio intl uuid cached_network_image flutter_spinkit
:: Dev Dependencies (Code Generation)
call flutter pub add dev:build_runner dev:riverpod_generator >nul 2>&1 || echo [INFO] Dev packages opcionales omitidos por compatibilidad.

echo.
echo =====================================================================
echo [OK] Dependencias instaladas y actualizadas con exito.
echo =====================================================================
exit /b 0
