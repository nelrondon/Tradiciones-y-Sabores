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

print("=== INICIANDO SERVICIO POSTGRESQL EN VPS ===")
cmds = (
    "systemctl start postgresql && "
    "systemctl enable postgresql && "
    "su - postgres -c \"psql -c \\\"ALTER USER postgres WITH PASSWORD 'postgres';\\\"\" && "
    "su - postgres -c \"psql -c \\\"CREATE DATABASE restaurant_equis;\\\"\" || true; "
    "systemctl restart restaurant-equis-api"
)
stdin, stdout, stderr = client.exec_command(cmds)
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))

stdin, stdout, stderr = client.exec_command("journalctl -u restaurant-equis-api.service -n 25 --no-pager")
print("\n=== LOGS DESPUES DE INICIAR POSTGRES ===")
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
