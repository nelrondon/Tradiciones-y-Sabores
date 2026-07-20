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

print("=== 1. CURL DIRECTO A FASTAPI 127.0.0.1:5000/api/ ===")
stdin, stdout, stderr = client.exec_command("curl -i http://127.0.0.1:5000/api/")
print(stdout.read().decode('utf-8', errors='ignore'))

print("\n=== 2. CURL A NGINX LOCAL 127.0.0.1/api/ ===")
stdin, stdout, stderr = client.exec_command("curl -i http://127.0.0.1/api/")
print(stdout.read().decode('utf-8', errors='ignore'))

print("\n=== 3. CURL A NGINX CON HOST HEADER NIP.IO ===")
stdin, stdout, stderr = client.exec_command("curl -i -H 'Host: restauranteequis.158.220.100.226.nip.io' http://127.0.0.1/api/")
print(stdout.read().decode('utf-8', errors='ignore'))

print("\n=== 4. ARCHIVO SITES-AVAILABLE RESTAURANT-EQUIS ===")
stdin, stdout, stderr = client.exec_command("cat /etc/nginx/sites-available/restaurant-equis")
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
