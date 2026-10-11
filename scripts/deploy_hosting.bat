@echo off
setlocal
echo ========================================================
echo   ALACENA Enterprise - Deploy Firebase Hosting
echo   Dominio de Produccion: alacena.cobertores.com
echo ========================================================

cd /d "%~dp0\.."

echo [1/2] Compilando bundle de produccion Web Flutter...
call C:\src\flutter\bin\flutter.bat build web --release
if errorlevel 1 (
    echo [ERROR] Fallo la compilacion de Flutter Web.
    exit /b 1
)

echo [2/2] Desplegando en Firebase Hosting (Proyecto: alacena-enterprise-prod)...
firebase deploy --only hosting:alacena-app --project alacena-enterprise-prod
if errorlevel 1 (
    echo [AVISO] Ejecuta 'firebase login' si no has autenticado tu sesion CLI.
    exit /b 1
)

echo ========================================================
echo   Despliegue finalizado con exito en https://alacena.cobertores.com
echo ========================================================
endlocal
