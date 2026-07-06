"""
nginx_fix.py — Verifica y aplica config nginx correcta para SPA React
"""
import paramiko

HOST     = "158.220.100.226"
USER     = "root"
PASSWORD = "1415162013asd"

NGINX_SITE_CONFIG = """\
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/html;
    index index.html;

    # Servir assets estaticos de React (JS, CSS, favicon)
    location /assets/ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API: redirigir al backend FastAPI en el puerto 5000
    location /api/ {
        proxy_pass         http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
    }

    # SPA fallback: todas las rutas van a index.html (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
"""

def run(client, cmd, label=None):
    if label:
        print(f"\n[{label}]")
    _, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out)
    if err: print(f"stderr: {err}")
    return out

def main():
    print("Conectando al servidor...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
    print("Conectado.\n")

    # Diagnosticar config actual de nginx
    run(client, "ls /etc/nginx/sites-enabled/", "Sites enabled")
    run(client, "cat /etc/nginx/sites-enabled/default 2>/dev/null || cat /etc/nginx/sites-available/default 2>/dev/null", "Config default actual")

    # Probar si los archivos JS son accesibles
    run(client, "curl -s -o /dev/null -w 'JS file HTTP: %{http_code}' http://localhost/assets/index-C6sPIZcu.js", "Test JS file")

    # Escribir nueva config
    print("\n[Aplicando config nginx corregida...]")
    sftp = client.open_sftp()
    with sftp.open("/etc/nginx/sites-available/default", "w") as f:
        f.write(NGINX_SITE_CONFIG)
    sftp.close()
    print("Config escrita en /etc/nginx/sites-available/default")

    # Asegurarse de que el symlink existe
    run(client, "ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default", "Symlink")

    # Verificar y recargar
    run(client, "nginx -t 2>&1", "nginx test")
    run(client, "nginx -s reload 2>&1", "nginx reload")

    # Probar de nuevo
    run(client, "curl -s -o /dev/null -w 'Root HTTP: %{http_code}' http://localhost/", "Test root")
    run(client, "curl -s -o /dev/null -w 'JS HTTP: %{http_code}' http://localhost/assets/index-C6sPIZcu.js", "Test JS")
    run(client, "curl -s -o /dev/null -w 'CSS HTTP: %{http_code}' http://localhost/assets/index-CiIc1wkn.css", "Test CSS")

    client.close()
    print("\nListo! Prueba http://158.220.100.226/ con Ctrl+Shift+R")

if __name__ == "__main__":
    main()
