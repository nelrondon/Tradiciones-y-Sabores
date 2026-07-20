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

print("=== 1. SYSTEMD STATUS ===")
stdin, stdout, stderr = client.exec_command("systemctl status restaurant-equis-api --no-pager")
print(stdout.read().decode('utf-8', errors='ignore'))

print("\n=== 2. ULTIMOS 40 LOGS ===")
stdin, stdout, stderr = client.exec_command("journalctl -u restaurant-equis-api.service -n 40 --no-pager")
print(stdout.read().decode('utf-8', errors='ignore'))

print("\n=== 3. PROBAR EJECUCION MANUAL ===")
stdin, stdout, stderr = client.exec_command("cd /opt/restaurant-equis/backend && venv/bin/python -c 'import main; print(main.app)'")
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))

client.close()
