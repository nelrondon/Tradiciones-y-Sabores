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

print("=== REINICIANDO NGINX Y PROBANDO PROXY ===")
stdin, stdout, stderr = client.exec_command("systemctl restart nginx")
stdout.read()

print("\n--- TEST PROXY NGINX LOCAL (http://127.0.0.1/api/) ---")
stdin, stdout, stderr = client.exec_command("curl -i http://127.0.0.1/api/")
print(stdout.read().decode('utf-8', errors='ignore'))

print("\n--- TEST PROXY NGINX CON HOST HEADER (http://127.0.0.1/api/) ---")
stdin, stdout, stderr = client.exec_command("curl -i -H 'Host: restauranteequis.158.220.100.226.nip.io' http://127.0.0.1/api/")
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
