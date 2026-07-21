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

print("=== INSTALANDO CERTBOT Y CERTIFICADO HTTPS EN CONTABO VPS ===")
cmds = (
    "export DEBIAN_FRONTEND=noninteractive && "
    "apt-get update -qq && "
    "apt-get install -y certbot python3-certbot-nginx && "
    "certbot --nginx -d restauranteequis.158.220.100.226.nip.io --non-interactive --agree-tos -m teofilobetancourt@gmail.com --redirect || true; "
    "systemctl restart nginx && "
    "curl -i https://restauranteequis.158.220.100.226.nip.io/api/"
)
stdin, stdout, stderr = client.exec_command(cmds)
out = stdout.read().decode('utf-8', errors='ignore')
err = stderr.read().decode('utf-8', errors='ignore')

print("\n=== STDOUT ===")
print(out)
print("\n=== STDERR ===")
print(err)

client.close()
