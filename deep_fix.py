"""
deep_fix.py — Diagnostico completo y fix definitivo del nginx
"""
import paramiko

HOST     = "158.220.100.226"
USER     = "root"
PASSWORD = "1415162013asd"

NGINX_CONFIG = """\
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/html;
    index index.html;

    # Assets estaticos de React (JS, CSS, favicon, imagenes)
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
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

    # SPA fallback: todas las rutas cargan index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
"""

def run(client, cmd, label=None):
    if label: print(f"\n[{label}]")
    _, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out)
    if err: print(f"(stderr) {err}")
    return out

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
    print("Conectado.\n")

    # Ver todo lo que esta habilitado
    run(client, "ls -la /etc/nginx/sites-enabled/", "Sites enabled")
    run(client, "cat /etc/nginx/sites-enabled/udofat 2>/dev/null || echo 'NO EXISTE'", "Config udofat")

    # Ver que HTML esta sirviendo ahora mismo
    run(client, "curl -s http://localhost/ | head -5", "HTML que sirve ahora")

    # Ver el titulo de index.html en el servidor
    run(client, "grep -o '<title>.*</title>' /var/www/html/index.html", "Titulo index.html del servidor")

    # Escribir el config correcto en udofat
    print("\n[Escribiendo config nginx correcto en udofat...]")
    sftp = client.open_sftp()

    # Leer el udofat actual para saber el root
    _, stdout, _ = client.exec_command("cat /etc/nginx/sites-enabled/udofat 2>/dev/null")
    udofat_content = stdout.read().decode()
    print("Contenido actual de udofat:")
    print(udofat_content[:800])

    # Encontrar el root directory del config udofat
    root_dir = "/var/www/html"
    for line in udofat_content.splitlines():
        if "root " in line and "#" not in line:
            parts = line.strip().split()
            if len(parts) >= 2:
                root_dir = parts[1].rstrip(";")
                break

    print(f"\nRoot directory detectado: {root_dir}")

    # Si el root es diferente a /var/www/html, copiar archivos ahi
    if root_dir != "/var/www/html":
        print(f"\n[Copiando archivos de /var/www/html/ a {root_dir}/]")
        run(client, f"mkdir -p {root_dir}/assets/")
        run(client, f"cp /var/www/html/index.html {root_dir}/")
        run(client, f"cp /var/www/html/favicon.svg {root_dir}/ 2>/dev/null || true")
        run(client, f"cp /var/www/html/assets/* {root_dir}/assets/")
        run(client, f"chmod -R 755 {root_dir}/")
        run(client, f"chown -R www-data:www-data {root_dir}/")
        run(client, f"ls -la {root_dir}/", f"Archivos en {root_dir}")
        run(client, f"ls -la {root_dir}/assets/", f"Assets en {root_dir}")

    # Actualizar la config udofat con SPA routing correcto
    config_con_root = NGINX_CONFIG.replace("/var/www/html", root_dir)

    # Escribir sobre el archivo udofat real (seguir symlink)
    _, stdout, _ = client.exec_command("readlink -f /etc/nginx/sites-enabled/udofat")
    real_path = stdout.read().decode().strip() or "/etc/nginx/sites-available/udofat"
    print(f"\n[Config real en: {real_path}]")

    with sftp.open(real_path, "w") as f:
        f.write(config_con_root)
    sftp.close()
    print("Config actualizada.")

    # Validar y recargar
    run(client, "nginx -t 2>&1", "nginx test")
    run(client, "nginx -s reload 2>&1", "nginx reload")

    # Tests finales
    run(client, "curl -s -o /dev/null -w 'Root: %{http_code}' http://localhost/", "Test root")
    run(client, "curl -s -o /dev/null -w 'JS: %{http_code}' http://localhost/assets/index-C6sPIZcu.js", "Test JS")
    run(client, "curl -s -o /dev/null -w 'CSS: %{http_code}' http://localhost/assets/index-CiIc1wkn.css", "Test CSS")
    run(client, "curl -s http://localhost/ | grep '<title>'", "Titulo final")

    client.close()
    print("\nListo! Recarga http://158.220.100.226/ con Ctrl+Shift+R")

if __name__ == "__main__":
    main()
