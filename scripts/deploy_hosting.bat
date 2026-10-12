@echo off
setlocal
echo ========================================================
echo   ALACENA Enterprise - Deploy Firebase Hosting
echo   Dominio de Produccion: alacena.cobertores.com
echo ========================================================

cd /d "%~dp0\.."

echo [1/2] Compilando bundle de produccion Frontend (React + Vite)...
cd frontend
call npm run build
if errorlevel 1 (
    echo [ERROR] Fallo la compilacion del Frontend.
    exit /b 1
)
cd ..

echo [2/2] Desplegando en Firebase Hosting (Proyecto: alacena-enterprise-prod)...
call npx firebase-tools deploy --only hosting:alacena-app --project alacena-enterprise-prod
if errorlevel 1 (
    echo [AVISO] Ejecuta 'login_and_fix_mcp.bat' para renovar tu sesion CLI.
    exit /b 1
)

echo ========================================================
echo   Despliegue finalizado con exito en https://alacena.cobertores.com
echo ========================================================
endlocal
