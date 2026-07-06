#!/usr/bin/env pwsh
# ═══════════════════════════════════════════════════════════════
#  deploy-backend.ps1 — Despliegue del Backend FastAPI
#  Restaurant Equis
#
#  Uso:
#    .\deploy-backend.ps1              ← sube y configura todo
#    .\deploy-backend.ps1 -SkipInstall ← solo sube el código (ya instalado)
#    .\deploy-backend.ps1 -Restart     ← solo reinicia el servicio
# ═══════════════════════════════════════════════════════════════

param(
  [switch]$SkipInstall,
  [switch]$Restart
)

# ── Helpers ────────────────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n  ► $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Err   { param($msg) Write-Host "  ✗ $msg" -ForegroundColor Red; exit 1 }
function Write-Info  { param($msg) Write-Host "    $msg" -ForegroundColor Gray }
function Write-Warn  { param($msg) Write-Host "  ⚠ $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "  ╔═══════════════════════════════════════════════╗" -ForegroundColor DarkYellow
Write-Host "  ║   Restaurant Equis — Backend Deploy Script    ║" -ForegroundColor DarkYellow
Write-Host "  ╚═══════════════════════════════════════════════╝" -ForegroundColor DarkYellow
Write-Host ""

# ── Leer credenciales ──────────────────────────────────────────
$envFile = Join-Path $PSScriptRoot ".deploy.env"
if (-not (Test-Path $envFile)) {
  Write-Err "No encontré .deploy.env`n    Crea uno copiando .deploy.env.example"
}

$config = @{}
Get-Content $envFile | Where-Object { $_ -match '^\s*[^#]' } | ForEach-Object {
  $parts = $_ -split '=', 2
  if ($parts.Count -eq 2) { $config[$parts[0].Trim()] = $parts[1].Trim() }
}

$SERVER_IP    = $config["SERVER_IP"]
$SSH_USER     = $config["SSH_USER"]
$SSH_PASSWORD = $config["SSH_PASSWORD"]
$BACKEND_PATH = "/opt/restaurant-equis/backend"

if (-not $SERVER_IP -or -not $SSH_USER) {
  Write-Err "Faltan SERVER_IP o SSH_USER en .deploy.env"
}

Write-Info "Servidor: $SSH_USER@$SERVER_IP"
Write-Info "Ruta:     $BACKEND_PATH"

# Helper para ejecutar comandos SSH
function Invoke-SSH {
  param([string]$Cmd)
  if (Get-Command "sshpass" -ErrorAction SilentlyContinue) {
    sshpass -p $SSH_PASSWORD ssh -o StrictHostKeyChecking=no "${SSH_USER}@${SERVER_IP}" $Cmd
  } else {
    ssh -o StrictHostKeyChecking=no "${SSH_USER}@${SERVER_IP}" $Cmd
  }
}

function Invoke-SCP {
  param([string]$Source, [string]$Dest)
  if (Get-Command "sshpass" -ErrorAction SilentlyContinue) {
    sshpass -p $SSH_PASSWORD scp -o StrictHostKeyChecking=no -r $Source "${SSH_USER}@${SERVER_IP}:${Dest}"
  } else {
    scp -o StrictHostKeyChecking=no -r $Source "${SSH_USER}@${SERVER_IP}:${Dest}"
  }
}

# ── Modo: solo reiniciar ───────────────────────────────────────
if ($Restart) {
  Write-Step "Reiniciando servicio en el servidor..."
  Invoke-SSH "sudo systemctl restart restaurant-equis-api && sudo systemctl status restaurant-equis-api --no-pager"
  Write-Ok "Servicio reiniciado"
  exit 0
}

# ── 1. Crear directorio en el servidor ────────────────────────
Write-Step "Preparando directorio en el servidor..."
Invoke-SSH "sudo mkdir -p $BACKEND_PATH && sudo chown ${SSH_USER}:${SSH_USER} /opt/restaurant-equis && sudo chown ${SSH_USER}:${SSH_USER} $BACKEND_PATH"
Write-Ok "Directorio listo"

# ── 2. Subir código del backend ───────────────────────────────
Write-Step "Subiendo archivos del backend..."
$backendLocal = Join-Path $PSScriptRoot "backend"

# Subir archivos uno a uno (excluir venv y __pycache__)
$files = @("main.py", "database.py", "models.py", "schemas.py", "requirements.txt", ".env.example", "README.md", "restaurant-equis-api.service")
foreach ($f in $files) {
  $local = Join-Path $backendLocal $f
  if (Test-Path $local) {
    Invoke-SCP $local $BACKEND_PATH
    Write-Info "Subido: $f"
  }
}

# Subir carpeta routers/
Invoke-SCP (Join-Path $backendLocal "routers") $BACKEND_PATH
Write-Ok "Código del backend subido"

# ── 3. Instalar dependencias ──────────────────────────────────
if (-not $SkipInstall) {
  Write-Step "Instalando dependencias Python..."
  Invoke-SSH @"
cd $BACKEND_PATH && \
python3 -m venv venv && \
./venv/bin/pip install --upgrade pip -q && \
./venv/bin/pip install -r requirements.txt -q && \
echo 'OK'
"@
  Write-Ok "Dependencias instaladas"
} else {
  Write-Info "Saltando instalación de dependencias (-SkipInstall)"
}

# ── 4. Configurar servicio systemd ────────────────────────────
Write-Step "Configurando servicio systemd..."
Invoke-SSH @"
sudo cp $BACKEND_PATH/restaurant-equis-api.service /etc/systemd/system/ && \
sudo systemctl daemon-reload && \
sudo systemctl enable restaurant-equis-api && \
echo 'Servicio configurado'
"@
Write-Ok "Servicio systemd habilitado"

# ── 5. Verificar .env ─────────────────────────────────────────
Write-Step "Verificando configuración .env..."
$envExistsResult = Invoke-SSH "test -f $BACKEND_PATH/.env && echo 'exists' || echo 'missing'"

if ($envExistsResult -match 'missing') {
  Write-Warn ".env NO encontrado en el servidor."
  Write-Warn "El equipo de BD debe crear $BACKEND_PATH/.env con las credenciales."
  Write-Warn "Plantilla disponible en: $BACKEND_PATH/.env.example"
  Write-Warn "El servicio NO se iniciará hasta que el .env esté configurado."
} else {
  # ── 6. Reiniciar servicio ──────────────────────────────────
  Write-Step "Iniciando servicio..."
  Invoke-SSH "sudo systemctl restart restaurant-equis-api"
  Start-Sleep -Seconds 3
  $status = Invoke-SSH "sudo systemctl is-active restaurant-equis-api"
  if ($status -match 'active') {
    Write-Ok "Backend corriendo en http://127.0.0.1:5000"
    Write-Info "Docs: http://$SERVER_IP/docs"
  } else {
    Write-Warn "El servicio no está activo. Verifica el .env y los logs:"
    Write-Warn "  sudo journalctl -u restaurant-equis-api -n 50"
  }
}

# ── 7. Actualizar nginx ───────────────────────────────────────
Write-Step "Actualizando y recargando Nginx..."
Invoke-SCP (Join-Path $PSScriptRoot "nginx.conf") "/etc/nginx/sites-available/restaurant-equis"
Invoke-SSH @"
sudo ln -sf /etc/nginx/sites-available/restaurant-equis /etc/nginx/sites-enabled/restaurant-equis 2>/dev/null; \
sudo nginx -t && sudo systemctl reload nginx && echo 'Nginx OK'
"@
Write-Ok "Nginx recargado"

# ── Resumen ───────────────────────────────────────────────────
Write-Host ""
Write-Host "  ═══════════════════════════════════════════════" -ForegroundColor DarkGreen
Write-Host "  ✓  Deploy del backend completado!" -ForegroundColor Green
Write-Host ""
Write-Host "  PRÓXIMO PASO:" -ForegroundColor Yellow
Write-Host "  El equipo de BD debe crear el archivo .env:" -ForegroundColor Yellow
Write-Host "  $BACKEND_PATH/.env" -ForegroundColor White
Write-Host ""
Write-Host "  Luego reiniciar con: .\deploy-backend.ps1 -Restart" -ForegroundColor Cyan
Write-Host "  ═══════════════════════════════════════════════" -ForegroundColor DarkGreen
Write-Host ""
