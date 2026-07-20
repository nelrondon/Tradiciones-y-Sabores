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

print("=== EJECUTANDO UVICORN EN SHELL DESDE WWW-DATA ===")
stdin, stdout, stderr = client.exec_command("su -s /bin/bash www-data -c 'cd /opt/restaurant-equis/backend && venv/bin/python main.py'")
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))

client.close()
