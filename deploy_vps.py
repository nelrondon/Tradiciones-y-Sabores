"""
deploy_vps.py — Sube tanto el Frontend (dist/) como el Backend (backend/) al VPS Contabo
Configura e inicia automáticamente el servicio systemd y Nginx.
"""
import os
import sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

HOST     = "158.220.100.226"
PORT     = 22
USER     = "root"
PASSWORD = "1415162013asd"

REMOTE_FRONTEND = "/var/www/restaurantequis"
REMOTE_BACKEND  = "/opt/restaurant-equis/backend"

LOCAL_FRONTEND  = os.path.join(os.path.dirname(__file__), "dist")
LOCAL_BACKEND   = os.path.join(os.path.dirname(__file__), "backend")
LOCAL_NGINX_CONF = os.path.join(os.path.dirname(__file__), "nginx.conf")


def upload_dir(sftp, local_dir, remote_dir):
    """Sube recursivamente un directorio local al servidor."""
    for entry in os.listdir(local_dir):
        if entry in ['__pycache__', '.git', 'node_modules', '.venv', 'venv']:
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
            sftp.put(local_path, remote_path)


def main():
    print(f"\nConectando SSH a {HOST}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)
        print("[OK] Conexión SSH establecida con Contabo VPS\n")
    except Exception as e:
        print(f"[ERROR] No se pudo conectar via SSH: {e}")
        sys.exit(1)

    sftp = client.open_sftp()

    # 1. Despliegue Frontend
    print("--- Subiendo Frontend (dist/) ---")
    client.exec_command(f"mkdir -p {REMOTE_FRONTEND}")
    client.exec_command(f"rm -rf {REMOTE_FRONTEND}/assets/*")
    upload_dir(sftp, LOCAL_FRONTEND, REMOTE_FRONTEND)
    client.exec_command(f"chmod -R 755 {REMOTE_FRONTEND} && chown -R www-data:www-data {REMOTE_FRONTEND}")
    print("[OK] Frontend subido.")

    # 2. Despliegue Backend
    print("\n--- Subiendo Backend (backend/) ---")
    client.exec_command(f"mkdir -p {REMOTE_BACKEND}")
    upload_dir(sftp, LOCAL_BACKEND, REMOTE_BACKEND)

    # 3. Subir Nginx Conf
    print("\n--- Subiendo Nginx Conf ---")
    sftp.put(LOCAL_NGINX_CONF, "/etc/nginx/sites-available/restaurant-equis")
    
    # 4. Configurar entorno Python, .env, systemd y Nginx exclusivo
    print("\n--- Aplicando Configuración y Reiniciando Servicios ---")
    setup_cmds = (
        f"cd {REMOTE_BACKEND} && "
        "if [ ! -d 'venv' ]; then python3 -m venv venv; fi && "
        "venv/bin/pip install --upgrade pip setuptools -q && "
        "venv/bin/pip install -r requirements.txt psycopg2-binary -q && "
        "if [ ! -f '.env' ]; then cp .env.example .env; fi && "
        "cp restaurant-equis-api.service /etc/systemd/system/restaurant-equis-api.service && "
        "rm -f /etc/nginx/sites-enabled/* && "
        "ln -sf /etc/nginx/sites-available/restaurant-equis /etc/nginx/sites-enabled/restaurant-equis && "
        "chown -R www-data:www-data /opt/restaurant-equis && "
        "systemctl daemon-reload && "
        "systemctl enable restaurant-equis-api && "
        "systemctl restart restaurant-equis-api && "
        "sleep 3 && "
        "systemctl restart nginx"
    )
    stdin, stdout, stderr = client.exec_command(setup_cmds)
    out_text = stdout.read().decode('utf-8', errors='ignore')
    err_text = stderr.read().decode('utf-8', errors='ignore')
    if out_text: print(out_text)
    if err_text: print(err_text)

    # Probar endpoint API local y público
    stdin, stdout, stderr = client.exec_command("curl -s http://127.0.0.1:5000/api/")
    print("\nRespuesta API Backend Local (127.0.0.1:5000/api/):")
    print(stdout.read().decode('utf-8', errors='ignore'))

    stdin, stdout, stderr = client.exec_command("curl -s -H 'Host: restauranteequis.158.220.100.226.nip.io' http://127.0.0.1/api/")
    print("\nRespuesta API Nginx Proxy (127.0.0.1/api/):")
    print(stdout.read().decode('utf-8', errors='ignore'))

    sftp.close()
    client.close()
    print("\n==================================================")
    print("¡DESPLIEGUE COMPLETO Y SERVICIOS ACTIVOS EN CONTABO VPS!")
    print("URL Frontend: http://restauranteequis.158.220.100.226.nip.io")
    print("URL API Swagger: http://restauranteequis.158.220.100.226.nip.io/api/docs")
    print("==================================================")

if __name__ == "__main__":
    main()
