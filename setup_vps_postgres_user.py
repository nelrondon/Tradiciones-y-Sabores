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

print("=== CONFIGURANDO USUARIO Y PERMISOS POSTGRES EN VPS ===")
cmds = (
    "su - postgres -c \"psql -c \\\"CREATE USER equis_user WITH PASSWORD 'equis_pass';\\\"\" || true; "
    "su - postgres -c \"psql -c \\\"ALTER USER equis_user WITH PASSWORD 'equis_pass';\\\"\" || true; "
    "su - postgres -c \"psql -c \\\"CREATE DATABASE restaurant_equis OWNER equis_user;\\\"\" || true; "
    "su - postgres -c \"psql -c \\\"GRANT ALL PRIVILEGES ON DATABASE restaurant_equis TO equis_user;\\\"\" || true; "
    "su - postgres -c \"psql -d restaurant_equis -c \\\"GRANT ALL ON SCHEMA public TO equis_user;\\\"\" || true; "
    "su - postgres -c \"psql -d restaurant_equis -c \\\"CREATE SCHEMA IF NOT EXISTS \\\\\\\"Inventario\\\\\\\"; AUTHORIZATION equis_user;\\\"\" || true; "
    "su - postgres -c \"psql -d restaurant_equis -c \\\"GRANT ALL ON SCHEMA \\\\\\\"Inventario\\\\\\\" TO equis_user;\\\"\" || true; "
    "systemctl restart restaurant-equis-api && "
    "sleep 3 && "
    "curl -s http://127.0.0.1:5000/api/"
)
stdin, stdout, stderr = client.exec_command(cmds)
out = stdout.read().decode('utf-8', errors='ignore')
err = stderr.read().decode('utf-8', errors='ignore')

print("\n=== STDOUT ===")
print(out)
print("\n=== STDERR ===")
print(err)

print("\n=== LOGS DEL SERVICIO ===")
stdin, stdout, stderr = client.exec_command("journalctl -u restaurant-equis-api.service -n 20 --no-pager")
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
