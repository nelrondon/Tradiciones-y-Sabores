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

stdin, stdout, stderr = client.exec_command("journalctl -u restaurant-equis-api.service -n 25 --no-pager")
print("=== LOGS SYSTEMD SERVICE ===")
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))

# Probar crear /opt/restaurant-equis/backend/.env si no existe
stdin, stdout, stderr = client.exec_command(
    "if [ ! -f '/opt/restaurant-equis/backend/.env' ]; then "
    "cp /opt/restaurant-equis/backend/.env.example /opt/restaurant-equis/backend/.env; "
    "fi; "
    "chown -R www-data:www-data /opt/restaurant-equis; "
    "systemctl restart restaurant-equis-api; "
    "systemctl status restaurant-equis-api --no-pager -n 10"
)
print("\n=== REINTENTO POST-ENV ===")
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))

client.close()
