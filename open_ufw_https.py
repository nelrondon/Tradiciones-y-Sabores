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

print("=== HABILITANDO PUERTO 443 (HTTPS) EN FIREWALL VPS ===")
cmds = (
    "ufw allow 443/tcp || true; "
    "ufw allow 'Nginx Full' || true; "
    "systemctl restart nginx"
)
stdin, stdout, stderr = client.exec_command(cmds)
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))

client.close()
