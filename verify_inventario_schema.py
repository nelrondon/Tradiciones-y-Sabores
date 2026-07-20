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

cmd = """
su - postgres -c "psql -d restaurant_equis -c '
SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN (\'public\', \'Inventario\');
'"
"""

stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
