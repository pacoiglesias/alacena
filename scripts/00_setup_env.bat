@echo off
setlocal enabledelayedexpansion
title ALACENA - Setup del Entorno de Desarrollo

echo =====================================================================
echo           ALACENA ENTERPRISE - SETUP DE ENTORNO (WINDOWS)
echo =====================================================================
echo.

:: 1. Verificar Git
echo [*] Verificando Git...
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git no esta instalado o no se encuentra en el PATH.
    echo         Instala Git desde: https://git-scm.com/download/win
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%g in ('git --version') do echo [OK] %%g
)

:: 2. Verificar Firebase CLI
echo.
echo [*] Verificando Firebase CLI...
where firebase >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [AVISO] Firebase CLI no detectado en el PATH.
    echo         Intentando instalar via npm...
    where npm >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        call npm install -g firebase-tools
    ) else (
        echo [ERROR] npm no encontrado. Instala Node.js desde https://nodejs.org
        pause
        exit /b 1
    )
) else (
    for /f "tokens=*" %%f in ('firebase --version') do echo [OK] Firebase CLI v%%f
)

:: 3. Verificar Flutter SDK
echo.
echo [*] Verificando Flutter SDK...
where flutter >nul 2>&1
if %ERRORLEVEL% equ 0 (
    for /f "tokens=*" %%l in ('flutter --version ^| findstr "Flutter"') do echo [OK] %%l
    goto :FLUTTER_OK
)

:: Si no esta en PATH, buscar en rutas comunes
echo [!] Flutter no esta en el PATH del sistema. Buscando en rutas estandar...
set "FLUTTER_PATH="

if exist "C:\src\flutter\bin\flutter.bat" set "FLUTTER_PATH=C:\src\flutter\bin"
if exist "C:\flutter\bin\flutter.bat" set "FLUTTER_PATH=C:\flutter\bin"
if exist "%LOCALAPPDATA%\flutter\bin\flutter.bat" set "FLUTTER_PATH=%LOCALAPPDATA%\flutter\bin"
if exist "%USERPROFILE%\flutter\bin\flutter.bat" set "FLUTTER_PATH=%USERPROFILE%\flutter\bin"
if exist "%~dp0..\tools\flutter\bin\flutter.bat" set "FLUTTER_PATH=%~dp0..\tools\flutter\bin"

if defined FLUTTER_PATH (
    echo [OK] Encontrado Flutter en: !FLUTTER_PATH!
    set "PATH=!FLUTTER_PATH!;!PATH!"
    goto :FLUTTER_OK
)

:: Si no se encontro, ofrecer descarga automatizada
echo.
echo =====================================================================
echo [AVISO] Flutter SDK no fue encontrado en tu equipo.
echo =====================================================================
echo Deseas que este script descargue e instale Flutter en C:\src\flutter?
set /p INST="Presiona S para descargar automaticamente o N para cancelar: "
if /i "!INST!"=="S" goto :DO_INSTALL
goto :NO_INSTALL

:DO_INSTALL
echo [*] Creando carpeta C:\src...
if not exist "C:\src" mkdir "C:\src"
echo [*] Descargando Flutter Windows Stable...
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.24.5-stable.zip', 'C:\src\flutter_windows.zip')"
if exist "C:\src\flutter_windows.zip" (
    echo [*] Descomprimiendo en C:\src...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path 'C:\src\flutter_windows.zip' -DestinationPath 'C:\src' -Force"
    del /f /q "C:\src\flutter_windows.zip"
    set "PATH=C:\src\flutter\bin;!PATH!"
    echo [*] Agregando C:\src\flutter\bin a las variables de entorno de usuario...
    setx PATH "%PATH%;C:\src\flutter\bin"
    echo [OK] Flutter instalado correctamente.
    goto :FLUTTER_OK
) else (
    echo [ERROR] No se pudo descargar el archivo zip de Flutter.
    pause
    exit /b 1
)

:NO_INSTALL
echo [INFO] Por favor descarga Flutter manualmente de https://flutter.dev/docs/get-started/install/windows
echo        y agrega la carpeta bin a tu variable PATH.
pause
exit /b 1

:FLUTTER_OK
echo.
echo [*] Ejecutando Flutter Doctor preliminar...
call flutter doctor -v

echo.
echo =====================================================================
echo [OK] Fase 0.1 completada: Entorno verificado con exito.
echo =====================================================================
exit /b 0
