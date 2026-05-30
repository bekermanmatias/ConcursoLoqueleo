# Docker con hot reload — mismo flujo que docker compose, recarga al guardar.
# Uso: .\scripts\dev.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "Deteniendo stacks anteriores (prod o dev)..." -ForegroundColor Cyan
docker compose down 2>$null
docker compose -f docker-compose.dev.yml down 2>$null

Write-Host ""
Write-Host "Levantando Docker en modo desarrollo (hot reload)..." -ForegroundColor Cyan
Write-Host "Sitio: http://localhost:8080  |  API: http://localhost:3000/api/health" -ForegroundColor Green
Write-Host "Guarda un archivo en frontend/ o backend/ y verás el cambio al instante." -ForegroundColor DarkGray
Write-Host "Ctrl+C para detener." -ForegroundColor DarkGray
Write-Host ""

docker compose -f docker-compose.dev.yml up --build
