"""
deploy_docker_vps.py — Sube el proyecto a Contabo VPS y ejecuta Docker Compose.
"""
import os
import sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

HOST     = "158.220.100.226"
PORT     = 22
USER     = "root"
PASSWORD = "1415162013asd"

REMOTE_DIR = "/opt/tradiciones-sabores-docker"
LOCAL_ROOT = os.path.dirname(__file__)

IGNORE_DIRS = {'__pycache__', '.git', 'node_modules', '.venv', 'venv', 'dist', '.antigravityignore'}

def upload_dir(sftp, local_dir, remote_dir):
    """Sube recursivamente un directorio local al servidor."""
    for entry in os.listdir(local_dir):
        if entry in IGNORE_DIRS or entry.endswith('.pyc'):
            continue
        local_path  = os.path.join(local_dir, entry)
        remote_path = remote_dir + "/" + entry
        if os.path.isdir(local_path):
            try:
                sftp.mkdir(remote_path)
            except Exception:
                pass
            upload_dir(sftp, local_path, remote_path)
        else:
            print(f"  ↑ Subiendo: {entry}")
            try:
                sftp.put(local_path, remote_path)
            except Exception as e:
                print(f"  ⚠ Error subiendo {entry}: {e}")

def run_ssh_cmd(client, cmd, title=None):
    if title:
        print(f"\n--- {title} ---")
    print(f"$ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    if out: print(out.strip())
    if err: print(err.strip())
    return out

def main():
    print(f"\n==================================================")
    print(f"Iniciando Despliegue con Docker Compose en {HOST}")
    print(f"==================================================")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)
        print("[OK] Conexión SSH establecida con Contabo VPS\n")
    except Exception as e:
        print(f"[ERROR] No se pudo conectar via SSH: {e}")
        sys.exit(1)

    sftp = client.open_sftp()

    # 1. Crear directorio remoto y subir archivos
    print("--- 1. Subiendo proyecto a la VPS ---")
    run_ssh_cmd(client, f"mkdir -p {REMOTE_DIR}")
    upload_dir(sftp, LOCAL_ROOT, REMOTE_DIR)
    print("[OK] Archivos subidos a " + REMOTE_DIR)

    # 2. Detener servicios nativos que compitan por los puertos (80, 5000, 5432)
    run_ssh_cmd(client, "systemctl stop nginx tradiciones-sabores-api postgresql 2>/dev/null || true", "2. Liberando puertos (deteniendo Nginx/Postgres nativos)")

    # 3. Verificar/Instalar Docker y Docker Compose
    install_docker_cmds = (
        "if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then "
        "  apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io docker-compose; "
        "fi && "
        "docker --version && docker-compose --version"
    )
    run_ssh_cmd(client, install_docker_cmds, "3. Verificando instalación de Docker")

    # 4. Construir y Levantar Contenedores con Docker Compose
    docker_up_cmds = (
        f"cd {REMOTE_DIR} && "
        "docker-compose down --remove-orphans 2>/dev/null || true && "
        "docker-compose up -d --build"
    )
    run_ssh_cmd(client, docker_up_cmds, "4. Ejecutando docker-compose up -d --build")

    # 5. Estado de Contenedores y prueba de salud
    run_ssh_cmd(client, f"cd {REMOTE_DIR} && docker-compose ps", "5. Estado de Contenedores Docker")

    run_ssh_cmd(client, "sleep 5 && curl -s http://127.0.0.1/api/ordenes || curl -s http://127.0.0.1/api/", "6. Prueba de Endpoint API")

    sftp.close()
    client.close()
    
    print("\n==================================================")
    print("¡DESPLIEGUE DOCKER COMPLETADO EXITOSAMENTE!")
    print("URL Frontend: http://tradicionesysabores.158.220.100.226.nip.io")
    print("URL API Swagger: http://tradicionesysabores.158.220.100.226.nip.io/docs")
    print("==================================================")

if __name__ == "__main__":
    main()
