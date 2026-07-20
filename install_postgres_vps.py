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

print("=== INSTALANDO POSTGRESQL EN CONTABO VPS ===")
cmds = (
    "export DEBIAN_FRONTEND=noninteractive && "
    "apt-get update -qq && "
    "apt-get install -y postgresql postgresql-contrib && "
    "systemctl start postgresql && "
    "systemctl enable postgresql && "
    "su - postgres -c \"psql -c \\\"ALTER USER postgres WITH PASSWORD 'postgres';\\\"\" && "
    "su - postgres -c \"psql -c \\\"CREATE DATABASE restaurant_equis;\\\"\" || true; "
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

print("\n=== ESTADO DEL SERVICIO BACKEND ===")
stdin, stdout, stderr = client.exec_command("systemctl status restaurant-equis-api --no-pager -n 10")
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
