@echo off
setlocal enabledelayedexpansion
title ALACENA - Suite Completa de Setup Automatizado

echo =====================================================================
echo    ALACENA ENTERPRISE - SUITE DE DESPLIEGUE ^& SETUP AUTOMATIZADO
echo =====================================================================
echo.
echo Este asistente guiara la configuracion completa de Fase 0:
echo  1. Verificacion e instalacion de Entorno (Git, Firebase, Flutter)
echo  2. Sincronizacion de Repositorio Git y .gitignore
echo  3. Configuracion de Firebase CLI y Targets de Hosting
echo  4. Inicializacion de Flutter con dependencias empresariales
echo.
pause

set "SCRIPT_DIR=%~dp0"

echo.
echo >>> [PASO 1/4] Ejecutando 00_setup_env.bat ...
call "%SCRIPT_DIR%00_setup_env.bat"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo el setup del entorno.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo >>> [PASO 2/4] Ejecutando 01_init_repo.bat ...
call "%SCRIPT_DIR%01_init_repo.bat"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo la inicializacion del repositorio.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo >>> [PASO 3/4] Ejecutando 02_setup_firebase.bat ...
call "%SCRIPT_DIR%02_setup_firebase.bat"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo la configuracion de Firebase.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo >>> [PASO 4/4] Ejecutando 03_init_flutter_project.bat ...
call "%SCRIPT_DIR%03_init_flutter_project.bat"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo la creacion de dependencias de Flutter.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo =====================================================================
echo [EXITO] Toda la Fase 0 ha sido configurada correctamente.
echo Ya puedes proceder con la Fase 1 o abrir el proyecto en tu editor.
echo =====================================================================
pause
exit /b 0
