@echo off
setlocal enabledelayedexpansion
title Diagnostico y Reparacion de MCP data-agent-kit

echo =====================================================================
echo      ANTIGRAVITY IDE - DIAGNOSTICO DE MCP ^& NAMED PIPES
echo =====================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0diagnose_mcp.ps1"

echo.
echo =====================================================================
echo Fin del diagnostico.
echo =====================================================================
pause
