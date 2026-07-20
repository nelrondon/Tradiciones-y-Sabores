import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

HOST     = "158.220.100.226"
PORT     = 22
USER     = "root"
PASSWORD = "1415162013asd"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)

print("=== REINICIANDO BACKEND Y ESPERANDO 10 SEGUNDOS ===")
stdin, stdout, stderr = client.exec_command("systemctl restart restaurant-equis-api")
stdout.read()

print("Esperando 10s para arranque completo del backend...")
time.sleep(10)

stdin, stdout, stderr = client.exec_command("systemctl status restaurant-equis-api --no-pager")
print(stdout.read().decode('utf-8', errors='ignore'))

print("\n=== REINICIANDO NGINX ===")
stdin, stdout, stderr = client.exec_command("systemctl restart nginx")
stdout.read()

print("\n=== PROBANDO LOCAL 127.0.0.1:5000/api/ ===")
stdin, stdout, stderr = client.exec_command("curl -i http://127.0.0.1:5000/api/")
print(stdout.read().decode('utf-8', errors='ignore'))

print("\n=== PROBANDO NGINX 127.0.0.1/api/ ===")
stdin, stdout, stderr = client.exec_command("curl -i http://127.0.0.1/api/")
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
