#!/usr/bin/env pwsh
# ═══════════════════════════════════════════════════════
#  deploy.ps1 — Script de despliegue automático
#  Restaurant Equis Frontend
#
#  Uso:
#    .\deploy.ps1                ← compilar y subir
#    .\deploy.ps1 -SkipBuild     ← solo subir (ya compilado)
# ═══════════════════════════════════════════════════════

param(
  [switch]$SkipBuild
)

# ── Colores de consola ─────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n  ► $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Err   { param($msg) Write-Host "  ✗ $msg" -ForegroundColor Red; exit 1 }
function Write-Info  { param($msg) Write-Host "    $msg" -ForegroundColor Gray }

Write-Host ""
Write-Host "  ╔═══════════════════════════════════════╗" -ForegroundColor DarkYellow
Write-Host "  ║   Restaurant Equis — Deploy Script    ║" -ForegroundColor DarkYellow
Write-Host "  ╚═══════════════════════════════════════╝" -ForegroundColor DarkYellow
Write-Host ""

# ── Leer credenciales del archivo .deploy.env ──────────
$envFile = Join-Path $PSScriptRoot ".deploy.env"
if (-not (Test-Path $envFile)) {
  Write-Err "No encontré el archivo .deploy.env`n    Crea uno copiando .deploy.env.example y rellena tus credenciales."
}

$config = @{}
Get-Content $envFile | Where-Object { $_ -match '^\s*[^#]' } | ForEach-Object {
  $parts = $_ -split '=', 2
  if ($parts.Count -eq 2) {
    $config[$parts[0].Trim()] = $parts[1].Trim()
  }
}

$SERVER_IP    = $config["SERVER_IP"]
$SSH_USER     = $config["SSH_USER"]
$SSH_PASSWORD = $config["SSH_PASSWORD"]
$SERVER_PATH  = $config["SERVER_PATH"]

if (-not $SERVER_IP -or -not $SSH_USER -or -not $SSH_PASSWORD) {
  Write-Err "Faltan credenciales en .deploy.env (SERVER_IP, SSH_USER, SSH_PASSWORD)"
}

Write-Info "Servidor : $SSH_USER@$SERVER_IP"
Write-Info "Ruta     : $SERVER_PATH"

# ── Verificar que sshpass esté disponible ──────────────
# En Windows usamos plink/pscp de PuTTY o el SSH nativo con clave
# Si el usuario tiene clave SSH configurada no necesita contraseña en el script.

# ── 1. Compilar ────────────────────────────────────────
if (-not $SkipBuild) {
  Write-Step "Compilando el proyecto..."
  Push-Location $PSScriptRoot
  npm run build
  if ($LASTEXITCODE -ne 0) { Write-Err "La compilación falló." }
  Pop-Location
  Write-Ok "Build completado"
} else {
  Write-Info "Saltando build (-SkipBuild activo)"
}

# ── 2. Verificar dist/ ─────────────────────────────────
$distPath = Join-Path $PSScriptRoot "dist"
if (-not (Test-Path "$distPath\index.html")) {
  Write-Err "No existe dist\index.html — ejecuta el script sin -SkipBuild"
}

# ── 3. Subir archivos via SCP ──────────────────────────
Write-Step "Subiendo archivos al servidor..."
Write-Info "Esto puede tardar unos segundos..."

# Intentar con sshpass si está disponible (Linux subsystem)
$useSshpass = $false
if (Get-Command "sshpass" -ErrorAction SilentlyContinue) {
  $useSshpass = $true
}

if ($useSshpass) {
  # WSL / Git Bash con sshpass
  $scpArgs = "-o StrictHostKeyChecking=no -r `"$distPath/*`" `"${SSH_USER}@${SERVER_IP}:${SERVER_PATH}/`""
  sshpass -p $SSH_PASSWORD scp $scpArgs
} else {
  # SCP nativo de Windows (pedirá contraseña interactivamente)
  Write-Info "Ingresa tu contraseña SSH cuando se solicite: $SSH_PASSWORD"
  scp -o StrictHostKeyChecking=no -r "$distPath\*" "${SSH_USER}@${SERVER_IP}:${SERVER_PATH}/"
}

if ($LASTEXITCODE -ne 0) { Write-Err "SCP falló. Verifica credenciales y conexión." }
Write-Ok "Archivos subidos"

# ── 4. Reiniciar / verificar Nginx ────────────────────
Write-Step "Verificando Nginx en el servidor..."
if ($useSshpass) {
  sshpass -p $SSH_PASSWORD ssh -o StrictHostKeyChecking=no "${SSH_USER}@${SERVER_IP}" "nginx -t && systemctl reload nginx && echo 'Nginx OK'"
} else {
  Write-Info "Ingresa tu contraseña SSH cuando se solicite."
  ssh -o StrictHostKeyChecking=no "${SSH_USER}@${SERVER_IP}" "nginx -t && systemctl reload nginx && echo 'Nginx OK'"
}
Write-Ok "Nginx recargado"

# ── 5. Resumen ─────────────────────────────────────────
Write-Host ""
Write-Host "  ═══════════════════════════════════════════" -ForegroundColor DarkGreen
Write-Host "  ✓  Deploy completado exitosamente!" -ForegroundColor Green
Write-Host "  →  http://$SERVER_IP" -ForegroundColor Cyan
Write-Host "  ═══════════════════════════════════════════" -ForegroundColor DarkGreen
Write-Host ""
