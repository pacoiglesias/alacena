@echo off
setlocal
echo ========================================================
echo   ALACENA Enterprise - Full Production Deployment
echo   Firestore + Hosting + Storage + Cloud Functions
echo ========================================================

cd /d "%~dp0\.."

echo [1/4] Verificando calidad de codigo...
call C:\src\flutter\bin\flutter.bat analyze
if errorlevel 1 (
    echo [ERROR] Hay advertencias o errores en flutter analyze.
    exit /b 1
)

echo [2/4] Ejecutando suite de pruebas unitarias y de widgets...
call C:\src\flutter\bin\flutter.bat test
if errorlevel 1 (
    echo [ERROR] Pruebas fallidas.
    exit /b 1
)

echo [3/4] Compilando Web de Produccion...
call C:\src\flutter\bin\flutter.bat build web --release

echo [4/4] Desplegando en Firebase (Reglas, Indices, Storage, Hosting y Functions)...
firebase deploy
if errorlevel 1 (
    echo [AVISO] Revisa tu conexion a Firebase CLI o ejecuta 'firebase login'.
    exit /b 1
)

echo ========================================================
echo   ALACENA Enterprise desplegado al 100% exitosamente!
echo ========================================================
endlocal
