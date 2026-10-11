@echo off
setlocal enabledelayedexpansion
title ALACENA - Inicializacion de Repositorio Git

echo =====================================================================
echo       ALACENA ENTERPRISE - SINCRONIZACION CON REPOSITORIO GIT
echo =====================================================================
echo.

set "REPO_URL=https://github.com/pacoiglesias/alacena.git"
set "ROOT_DIR=%~dp0.."
cd /d "%ROOT_DIR%"

echo [*] Directorio de trabajo: %CD%

:: 1. Crear .gitignore integral para Flutter + Firebase + Windows
echo [*] Generando .gitignore profesional...
(
echo # Miscellaneous
echo *.class
echo *.log
echo *.pyc
echo *.swp
echo .DS_Store
echo .atom/
echo .buildlog/
echo .history
echo .svn/
echo migrate_working_dir/
echo.
echo # IntelliJ related
echo *.iml
echo *.ipr
echo *.iws
echo .idea/
echo.
echo # The .vscode folder has user preferences
echo .vscode/
echo.
echo # Flutter/Dart/Pub related
echo **/doc/api/
echo **/ios/Flutter/.last_build_id
echo .dart_tool/
echo .flutter-plugins
echo .flutter-plugins-dependencies
echo .packages
echo .pub-cache/
echo .pub/
echo /build/
echo.
echo # Android related
echo **/android/**/gradle-wrapper.jar
echo **/android/.gradle
echo **/android/captures/
echo **/android/gradlew
echo **/android/gradlew.bat
echo **/android/local.properties
echo **/android/**/GeneratedPluginRegistrant.java
echo.
echo # iOS/macOS related
echo **/ios/**/*.mode1v3
echo **/ios/**/*.mode2v3
echo **/ios/**/*.moved-project-dir
echo **/ios/**/*.pbxuser
echo **/ios/**/*.perspectivev3
echo **/ios/**/*sync/
echo **/ios/**/.sconsign.dblite
echo **/ios/**/.tags*
echo **/ios/**/DerivedData/
echo **/ios/**/Icon?
echo **/ios/**/Pods/
echo **/ios/**/.symlinks/
echo **/ios/**/profile
echo **/ios/**/xcuserdata
echo **/ios/Podfile.lock
echo.
echo # Firebase
echo .firebase/
echo firebase-debug.log
echo firestore-debug.log
echo ui-debug.log
echo.
echo # Secrets ^& Credentials
echo *.keystore
echo *.jks
echo google-services.json
echo GoogleService-Info.plist
echo .env*
echo !.env.example
) > "%ROOT_DIR%\.gitignore"

:: 2. Inicializar Git si no existe
if not exist "%ROOT_DIR%\.git" (
    echo [*] Inicializando repositorio Git local...
    git init
    git branch -M main
) else (
    echo [OK] Repositorio Git local ya inicializado.
)

:: 3. Configurar remoto origin
echo [*] Configurando remote origin: %REPO_URL%
git remote get-url origin >nul 2>&1
if %ERRORLEVEL% equ 0 (
    git remote set-url origin %REPO_URL%
    echo [OK] Remote origin actualizado.
) else (
    git remote add origin %REPO_URL%
    echo [OK] Remote origin anadido.
)

:: 4. Verificar conexion con GitHub
echo [*] Probando conexion con GitHub...
git ls-remote --exit-code origin >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Conectado exitosamente con %REPO_URL%
) else (
    echo [AVISO] No se pudo verificar el remoto automaticamente ^(requiere credenciales o el repo es privado^).
    echo        Asegurate de haber iniciado sesion con Git Credential Manager o tu SSH key.
)

echo.
echo =====================================================================
echo [OK] Fase 0.2 completada: Repositorio enlazado y .gitignore generado.
echo =====================================================================
exit /b 0
