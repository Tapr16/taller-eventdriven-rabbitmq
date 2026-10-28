# Arranca Docker Desktop en los PCs de la universidad.
# Docker falla con "rename ...sock ...sock.stale: El sistema no tiene acceso al archivo"
# cuando quedan sockets de una sesion anterior. Este script aparta esas carpetas
# (renombrarlas si funciona, borrar los sockets no) y vuelve a lanzar Docker.
# Uso:  powershell -ExecutionPolicy Bypass -File .\arreglar-docker.ps1

$ErrorActionPreference = "Continue"
$local = $env:LOCALAPPDATA
$stamp = Get-Date -Format "yyyyMMddHHmmss"

Write-Host "Cerrando procesos de Docker..."
Get-Process | Where-Object { $_.Name -match "docker" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

foreach ($dir in @("$local\Docker\run", "$local\docker-secrets-engine")) {
    if (Test-Path $dir) {
        $leaf = Split-Path $dir -Leaf
        Rename-Item $dir "$leaf.old-$stamp" -ErrorAction SilentlyContinue
        if (Test-Path $dir) { Write-Host "No se pudo apartar $dir" -ForegroundColor Red }
        else { Write-Host "Apartado: $dir" }
    }
}
Remove-Item "$local\Docker\backend.error.json" -Force -ErrorAction SilentlyContinue

Write-Host "Iniciando Docker Desktop..."
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

for ($i = 0; $i -lt 80; $i++) {
    Start-Sleep -Seconds 3
    docker info --format "{{.ServerVersion}}" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker listo (motor $(docker version --format '{{.Server.Version}}'))" -ForegroundColor Green
        exit 0
    }
    if (Test-Path "$local\Docker\backend.error.json") {
        Write-Host "Docker reporto un error:" -ForegroundColor Red
        Get-Content "$local\Docker\backend.error.json" -Raw | Select-String -Pattern '"description":"[^"]*"' -AllMatches |
            ForEach-Object { $_.Matches.Value } | Select-Object -First 2
        exit 1
    }
}
Write-Host "Docker no respondio a tiempo" -ForegroundColor Yellow
exit 1
