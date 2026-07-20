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

print("=== REINICIANDO NGINX DE FORMA COMPLETA ===")
stdin, stdout, stderr = client.exec_command("systemctl restart nginx && systemctl status nginx --no-pager -n 5")
print(stdout.read().decode('utf-8', errors='ignore'))

print("\n=== PROBANDO CURL LOCAL A NGINX ===")
stdin, stdout, stderr = client.exec_command("curl -i http://127.0.0.1/api/")
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
