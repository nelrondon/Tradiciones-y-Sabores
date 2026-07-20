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

print("=== REINICIANDO Y ESPERANDO 3 SEGUNDOS ===")
stdin, stdout, stderr = client.exec_command(
    "systemctl restart restaurant-equis-api && "
    "sleep 3 && "
    "curl -i http://127.0.0.1:5000/api/ && "
    "curl -i http://127.0.0.1/api/"
)
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))

client.close()
