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

print("=== 1. VER PUERTOS EN ESCUCHA (NETSTAT) ===")
stdin, stdout, stderr = client.exec_command("ss -tlpn | grep 443 || netstat -tlpn | grep 443")
print(stdout.read().decode('utf-8', errors='ignore'))

print("\n=== 2. TEST HTTPS INTERNO LOCAL IN VPS ===")
stdin, stdout, stderr = client.exec_command("curl -k -i https://127.0.0.1/")
print(stdout.read().decode('utf-8', errors='ignore'))

print("\n=== 3. CONFIGURACION DE NGINX SITES-AVAILABLE ===")
stdin, stdout, stderr = client.exec_command("cat /etc/nginx/sites-available/restaurant-equis")
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
