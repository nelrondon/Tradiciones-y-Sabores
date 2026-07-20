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

print("=== 1. ARCHIVOS EN SITES-ENABLED ===")
stdin, stdout, stderr = client.exec_command("ls -la /etc/nginx/sites-enabled/ /etc/nginx/conf.d/")
print(stdout.read().decode('utf-8', errors='ignore'))

print("\n=== 2. SERVER BLOCKS CONFIGURADOS EN NGINX ===")
stdin, stdout, stderr = client.exec_command("grep -rn 'server_name' /etc/nginx/")
print(stdout.read().decode('utf-8', errors='ignore'))

print("\n=== 3. PROBAR CURL CON HOST HEADER HECHO DESDE EL VPS ===")
stdin, stdout, stderr = client.exec_command("curl -i -H 'Host: restauranteequis.158.220.100.226.nip.io' http://127.0.0.1/api/")
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
