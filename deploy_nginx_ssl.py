import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

HOST     = "158.220.100.226"
PORT     = 22
USER     = "root"
PASSWORD = "1415162013asd"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)

print("=== DEPLEGANDO NGINX CONF CON HTTPS Y PROXY PASS SIN TRAILING SLASH ===")

nginx_content = """server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;

    server_name 158.220.100.226 restauranteequis.158.220.100.226.nip.io *.nip.io _;

    # Certificados SSL de Let's Encrypt para HTTPS
    ssl_certificate /etc/letsencrypt/live/restauranteequis.158.220.100.226.nip.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/restauranteequis.158.220.100.226.nip.io/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ── Frontend estático (React/Vite compilado) ───────────────
    root /var/www/restaurantequis;
    index index.html;

    # ── Swagger UI / Docs de FastAPI ──────────────────────────
    location /docs {
        proxy_pass         http://127.0.0.1:5000/docs;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
    }

    location /api/docs {
        proxy_pass         http://127.0.0.1:5000/docs;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
    }

    location /openapi.json {
        proxy_pass         http://127.0.0.1:5000/openapi.json;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
    }

    location /api/openapi.json {
        proxy_pass         http://127.0.0.1:5000/openapi.json;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
    }

    # ── Reverse Proxy → FastAPI en :5000 ──────────────────────
    location /api/ {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }

    # ── SPA fallback ──────────────────────────────────────────
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ── Assets con caché agresivo ─────────────────────────────
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # ── Compresión ────────────────────────────────────────────
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    # ── Seguridad ─────────────────────────────────────────────
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
"""

sftp = client.open_sftp()
with sftp.open("/etc/nginx/sites-available/restaurant-equis", "w") as f:
    f.write(nginx_content)
sftp.close()

stdin, stdout, stderr = client.exec_command("nginx -t && systemctl restart nginx")
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))

print("\n=== PROBANDO HTTP Y HTTPS EN PROXIES ===")
stdin, stdout, stderr = client.exec_command("curl -i http://127.0.0.1/api/productos")
print(stdout.read().decode('utf-8', errors='ignore')[:300])

client.close()
