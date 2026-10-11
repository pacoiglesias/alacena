@echo off
setlocal enabledelayedexpansion

echo =====================================================================
echo   🏛️ ALACENA Enterprise - Script Maestro de Inicializacion (Fase 0)
echo   Repositorio: https://github.com/pacoiglesias/alacena
echo   Hosting Target: alacena.cobertores.com
echo =====================================================================

cd /d "%~dp0\.."

:: 1. Verificacion de Git
echo [*] [1/5] Verificando entorno Git...
where git >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git no esta instalado o no se encuentra en el PATH del sistema.
    exit /b 1
)
git status >nul 2>&1
if errorlevel 1 (
    echo [*] Inicializando repositorio Git y vinculando a origin...
    git init
    git remote add origin https://github.com/pacoiglesias/alacena.git
) else (
    echo [OK] Repositorio Git activo. Rama actual:
    git branch --show-current
)

:: 2. Verificacion de Flutter SDK
echo [*] [2/5] Verificando Flutter SDK...
where flutter >nul 2>&1
if errorlevel 1 (
    if exist "C:\src\flutter\bin\flutter.bat" (
        echo [*] Agregando Flutter temporalmente desde C:\src\flutter\bin...
        set "PATH=C:\src\flutter\bin;%PATH%"
    ) else (
        echo [ERROR] Flutter SDK no encontrado en PATH ni en C:\src\flutter\bin.
        exit /b 1
    )
)
call flutter --version
if errorlevel 1 (
    echo [ERROR] No se pudo ejecutar Flutter SDK.
    exit /b 1
)

:: 3. Verificacion de Firebase CLI
echo [*] [3/5] Verificando Firebase CLI y Proyecto Vinculado...
where firebase >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Firebase CLI no esta instalado. Instalar con 'npm install -g firebase-tools'.
    exit /b 1
)
call firebase projects:list >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Sesion no iniciada en Firebase CLI. Ejecuta 'firebase login'.
) else (
    echo [OK] Sesion activa en Firebase CLI.
)

:: 4. Descarga de Dependencias Flutter
echo [*] [4/5] Instalando dependencias de Flutter (pub get)...
call flutter pub get
if errorlevel 1 (
    echo [ERROR] Fallo 'flutter pub get'. Revisa pubspec.yaml.
    exit /b 1
)

:: 5. Diagnostico de Calidad (Flutter Analyze)
echo [*] [5/5] Ejecutando analisis estatico de codigo...
call flutter analyze
if errorlevel 1 (
    echo [AVISO] Se detectaron observaciones en flutter analyze.
) else (
    echo [OK] 0 errores y 0 advertencias en el codigo Dart.
)

echo =====================================================================
echo   ✅ Setup Fase 0 finalizado exitosamente. Entorno listo para Fase 1.
echo =====================================================================
endlocal
