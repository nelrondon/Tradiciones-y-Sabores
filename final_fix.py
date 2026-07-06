"""
final_fix.py — Limpia archivos viejos, arregla nginx config definitivamente
"""
import paramiko

HOST     = "158.220.100.226"
USER     = "root"
PASSWORD = "1415162013asd"

# Config correcta para udofat - sin default_server (udofat usa server_name especifico)
UDOFAT_CONFIG = """\
server {
    listen 80;
    listen [::]:80;
    server_name 158.220.100.226;

    root /var/www/restaurantequis;
    index index.html;

    # Assets React (JS, CSS, SVG) - cache largo
    location /assets/ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Favicon y otros archivos estaticos de la raiz
    location ~* \\.(svg|ico|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot)$ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public";
    }

    # API proxy -> FastAPI en puerto 5000
    location /api/ {
        proxy_pass         http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
    }

    # SPA fallback: cualquier ruta carga index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Compresion gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
"""

def run(client, cmd, label=None):
    if label: print(f"\n[{label}]")
    _, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out)
    if err: print(f"  (stderr) {err}")
    return out

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
    print("Conectado.\n")

    # 1. Eliminar el symlink 'default' que cause el conflicto
    run(client, "rm -f /etc/nginx/sites-enabled/default", "Removiendo symlink default (conflicto)")
    run(client, "ls /etc/nginx/sites-enabled/", "Sites enabled ahora")

    # 2. Limpiar archivos VIEJOS de assets (dejar solo los del build actual)
    run(client, "ls /var/www/restaurantequis/assets/", "Assets ANTES de limpiar")
    run(client,
        "cd /var/www/restaurantequis/assets/ && "
        "ls | grep -v 'index-C6sPIZcu.js\\|index-CiIc1wkn.css' | xargs rm -f",
        "Eliminando JS/CSS viejos")
    run(client, "ls /var/www/restaurantequis/assets/", "Assets DESPUES de limpiar")

    # 3. Escribir config correcta en udofat
    sftp = client.open_sftp()
    with sftp.open("/etc/nginx/sites-available/udofat", "w") as f:
        f.write(UDOFAT_CONFIG)
    sftp.close()
    print("\n[Config udofat actualizada con proxy /api/ y SPA routing correcto]")

    # 4. Validar y recargar
    result = run(client, "nginx -t 2>&1", "nginx -t")
    if "successful" in result:
        run(client, "nginx -s reload", "nginx reload OK")
    else:
        print("ERROR en nginx config!")

    # 5. Tests HTTP finales
    run(client, "curl -s -o /dev/null -w 'Root:  %{http_code}' http://localhost/",        "Test root")
    run(client, "curl -s -o /dev/null -w 'JS:    %{http_code}' http://localhost/assets/index-C6sPIZcu.js",  "Test JS nuevo")
    run(client, "curl -s -o /dev/null -w 'CSS:   %{http_code}' http://localhost/assets/index-CiIc1wkn.css", "Test CSS nuevo")

    # 6. Ver el titulo del HTML que sirve ahora
    run(client, "curl -s http://localhost/ | grep 'title\\|charset'", "HTML que sirve")

    client.close()
    print("\nListo! Abre http://158.220.100.226/ con Ctrl+Shift+R (o en modo incognito)")

if __name__ == "__main__":
    main()
