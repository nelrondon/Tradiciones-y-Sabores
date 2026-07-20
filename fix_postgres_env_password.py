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

print("=== 1. CREAR /opt/restaurant-equis/backend/.env CON DB_PASSWORD=postgres Y DB_USER=postgres ===")
env_content = """DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_equis
DB_USER=postgres
DB_PASSWORD=postgres
CORS_ORIGINS=*
"""

sftp = client.open_sftp()
with sftp.open("/opt/restaurant-equis/backend/.env", "w") as f:
    f.write(env_content)
sftp.close()

print("=== 2. CONFIGURAR POSTGRES USER postgres WITH PASSWORD 'postgres' ===")
cmds = (
    "su - postgres -c \"psql -c \\\"ALTER USER postgres WITH PASSWORD 'postgres';\\\"\" && "
    "su - postgres -c \"psql -c \\\"CREATE DATABASE restaurant_equis;\\\"\" || true; "
    "su - postgres -c \"psql -c \\\"GRANT ALL PRIVILEGES ON DATABASE restaurant_equis TO postgres;\\\"\" || true; "
    "systemctl restart postgresql && "
    "systemctl restart restaurant-equis-api && "
    "sleep 4 && "
    "systemctl restart nginx && "
    "sleep 2 && "
    "curl -i http://127.0.0.1:5000/api/ && "
    "curl -i http://127.0.0.1/api/"
)

stdin, stdout, stderr = client.exec_command(cmds)
print("\n=== STDOUT ===")
print(stdout.read().decode('utf-8', errors='ignore'))
print("\n=== STDERR ===")
print(stderr.read().decode('utf-8', errors='ignore'))

client.close()
