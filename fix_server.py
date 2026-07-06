"""
fix_server.py — Diagnostica y arregla el servidor
"""
import paramiko
import sys

HOST     = "158.220.100.226"
USER     = "root"
PASSWORD = "1415162013asd"

def run(client, cmd, label=None):
    if label:
        print(f"\n--- {label} ---")
    _, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out)
    if err: print(f"[err] {err}")
    return out

def main():
    print("Conectando...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
    print("Conectado.\n")

    # 1. Ver config de nginx (root de archivos)
    run(client, "grep -r 'root\\|server_name\\|listen\\|try_files' /etc/nginx/sites-enabled/ 2>/dev/null || grep -r 'root\\|server_name\\|listen' /etc/nginx/nginx.conf", "Config Nginx")

    # 2. Ver permisos actuales
    run(client, "ls -la /var/www/html/", "Permisos /var/www/html/")
    run(client, "ls -la /var/www/html/assets/ 2>/dev/null", "Permisos assets/")

    # 3. Arreglar permisos
    print("\n--- Arreglando permisos ---")
    run(client, "chmod -R 755 /var/www/html/", "chmod 755")
    run(client, "chown -R www-data:www-data /var/www/html/", "chown www-data")

    # 4. Verificar
    run(client, "ls -la /var/www/html/", "Permisos despues del fix")
    run(client, "ls -la /var/www/html/assets/", "Assets despues del fix")

    # 5. Verificar que nginx apunta al lugar correcto
    run(client, "nginx -t 2>&1", "nginx test")
    run(client, "nginx -s reload 2>&1", "nginx reload")

    # 6. Test HTTP
    run(client, "curl -s -o /dev/null -w 'HTTP status: %{http_code}' http://localhost/", "Test HTTP local")
    run(client, "curl -s -o /dev/null -w 'HTTP status assets: %{http_code}' http://localhost/assets/ 2>/dev/null", "Test assets local")

    print("\n--- Verificacion final ---")
    run(client, "ls -la /var/www/html/", "Archivos finales")

    client.close()
    print("\nListo. Recarga http://158.220.100.226/ con Ctrl+Shift+R")

if __name__ == "__main__":
    main()
