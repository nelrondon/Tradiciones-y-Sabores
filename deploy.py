"""
deploy.py — Sube el dist/ al servidor y verifica Nginx
"""
import paramiko
import os
import sys

HOST     = "158.220.100.226"
PORT     = 22
USER     = "root"
PASSWORD = "1415162013asd"
REMOTE   = "/var/www/restaurantequis"
LOCAL    = os.path.join(os.path.dirname(__file__), "dist")

def upload_dir(sftp, local_dir, remote_dir):
    """Sube recursivamente un directorio local al servidor."""
    for entry in os.listdir(local_dir):
        local_path  = os.path.join(local_dir, entry)
        remote_path = remote_dir + "/" + entry
        if os.path.isdir(local_path):
            try:
                sftp.mkdir(remote_path)
            except Exception:
                pass  # Ya existe
            upload_dir(sftp, local_path, remote_path)
        else:
            print(f"  ↑ {remote_path}")
            sftp.put(local_path, remote_path)

def main():
    print(f"\n🚀 Conectando a {HOST}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)
        print("✅ Conexión SSH establecida\n")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        sys.exit(1)

    # Limpiar assets viejos para evitar acumular compilaciones
    print(f"🧹 Limpiando assets anteriores en {REMOTE}/assets/...")
    client.exec_command(f"rm -rf {REMOTE}/assets/*")

    # Asegurarse de que el directorio remoto exista
    client.exec_command(f"mkdir -p {REMOTE}/assets")

    # Subir el dist/
    print(f"\n📤 Subiendo {LOCAL} → {REMOTE}/")
    sftp = client.open_sftp()
    upload_dir(sftp, LOCAL, REMOTE)
    sftp.close()

    # Recargar Nginx por si acaso
    print("🔄 Recargando Nginx...")
    _, stdout, stderr = client.exec_command("nginx -s reload 2>&1 || systemctl reload nginx 2>&1")
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(f"   {out}")
    if err: print(f"   {err}")

    # Forzar permisos correctos
    client.exec_command(f"chmod -R 755 {REMOTE} && chown -R www-data:www-data {REMOTE}")

    client.close()
    print("\n✅ Despliegue completado. Abre http://restauranteequis.158.220.100.226.nip.io/ y recarga con Ctrl+Shift+R")

if __name__ == "__main__":
    main()
