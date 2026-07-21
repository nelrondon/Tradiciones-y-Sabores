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

print("=== 1. TEST DIRECTO A PORT 5000 /api/productos ===")
stdin, stdout, stderr = client.exec_command("curl -i http://127.0.0.1:5000/api/productos")
print(stdout.read().decode('utf-8', errors='ignore'))

print("\n=== 2. TEST DIRECTO A PORT 5000 /productos ===")
stdin, stdout, stderr = client.exec_command("curl -i http://127.0.0.1:5000/productos")
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
