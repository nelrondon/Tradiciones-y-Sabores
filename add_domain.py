"""
add_domain.py — Agrega un dominio al nginx config del servidor
Uso: python add_domain.py restauranteequis.duckdns.org
"""
import paramiko
import sys

HOST     = "158.220.100.226"
USER     = "root"
PASSWORD = "1415162013asd"

DOMINIO = sys.argv[1] if len(sys.argv) > 1 else "restauranteequis.duckdns.org"

UDOFAT_CONFIG = f"""\
server {{
    listen 80;
    listen [::]:80;
    server_name 158.220.100.226 {DOMINIO};

    root /var/www/restaurantequis;
    index index.html;

    location /assets/ {{
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }}

    location ~* \\.(svg|ico|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot)$ {{
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public";
    }}

    location /api/ {{
        proxy_pass         http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
    }}

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}}
"""

def run(client, cmd, label=None):
    if label: print(f"[{label}]")
    _, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out)
    if err: print(f"  {err}")
    return out

def main():
    print(f"Agregando dominio: {DOMINIO}")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=15)

    sftp = client.open_sftp()
    with sftp.open("/etc/nginx/sites-available/udofat", "w") as f:
        f.write(UDOFAT_CONFIG)
    sftp.close()

    run(client, "nginx -t 2>&1", "nginx test")
    run(client, "nginx -s reload 2>&1", "nginx reload")
    run(client, f"curl -s -o /dev/null -w 'HTTP: %{{http_code}}' http://localhost/", "Test local")

    client.close()
    print(f"\nListo! El sistema ahora acepta: http://{DOMINIO}/")

if __name__ == "__main__":
    main()
