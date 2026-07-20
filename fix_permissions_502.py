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

print("=== 1. PERMISOS ACTUALES EN /opt/restaurant-equis ===")
stdin, stdout, stderr = client.exec_command("ls -la /opt/restaurant-equis/backend/")
print(stdout.read().decode('utf-8', errors='ignore'))

print("\n=== 2. FIJAR PERMISOS 777 Y OWNER WWW-DATA ===")
stdin, stdout, stderr = client.exec_command(
    "chown -R www-data:www-data /opt/restaurant-equis && "
    "chmod -R 777 /opt/restaurant-equis && "
    "systemctl restart restaurant-equis-api"
)
print(stdout.read().decode('utf-8', errors='ignore'))

print("\n=== 3. PROBAR REQUEST COMO USUARIO WWW-DATA ===")
stdin, stdout, stderr = client.exec_command("su -s /bin/bash www-data -c 'curl -i http://127.0.0.1:5000/api/'")
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))

client.close()
