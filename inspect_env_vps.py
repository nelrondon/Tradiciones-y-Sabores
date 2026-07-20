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

print("=== CONTENIDO DE /opt/restaurant-equis/backend/.env ===")
stdin, stdout, stderr = client.exec_command("cat /opt/restaurant-equis/backend/.env")
print(stdout.read().decode('utf-8', errors='ignore'))

# Actualizar pg_hba.conf para permitir md5/trust local o ajustar el usuario postgres
print("\n=== AJUSTANDO POSTGRESQL PARA ACEPTAR CONEXION LOCAL TRUST ===")
pg_cmd = (
    "su - postgres -c \"psql -c \\\"ALTER USER postgres PASSWORD 'postgres';\\\"\" && "
    "su - postgres -c \"psql -c \\\"CREATE USER equis_user WITH PASSWORD 'equis_pass';\\\"\" || true; "
    "su - postgres -c \"psql -c \\\"ALTER USER equis_user PASSWORD 'equis_pass';\\\"\" || true; "
    "su - postgres -c \"psql -c \\\"CREATE DATABASE restaurant_equis OWNER equis_user;\\\"\" || true; "
    "su - postgres -c \"psql -c \\\"GRANT ALL PRIVILEGES ON DATABASE restaurant_equis TO equis_user;\\\"\" || true; "
    "sed -i 's/local   all             all                                     peer/local   all             all                                     trust/' /etc/postgresql/16/main/pg_hba.conf || true; "
    "sed -i 's/host    all             all             127.0.0.1\\/32            scram-sha-256/host    all             all             127.0.0.1\\/32            trust/' /etc/postgresql/16/main/pg_hba.conf || true; "
    "systemctl restart postgresql && "
    "systemctl restart restaurant-equis-api && "
    "sleep 4 && "
    "curl -i http://127.0.0.1:5000/api/"
)
stdin, stdout, stderr = client.exec_command(pg_cmd)
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))

client.close()
