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

print("=== 1. TEST CURL CON HOST HEADER A NGINX LOCAL ===")
stdin, stdout, stderr = client.exec_command("curl -i -H 'Host: restauranteequis.158.220.100.226.nip.io' http://127.0.0.1/api/")
print(stdout.read().decode('utf-8', errors='ignore'))

print("\n=== 2. NGINX ERROR LOG ULTIMAS 15 LINEAS ===")
stdin, stdout, stderr = client.exec_command("tail -n 15 /var/log/nginx/error.log")
print(stdout.read().decode('utf-8', errors='ignore'))

print("\n=== 3. COMPROBAR NGINX SITES-ENABLED ===")
stdin, stdout, stderr = client.exec_command("ls -la /etc/nginx/sites-enabled/")
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
