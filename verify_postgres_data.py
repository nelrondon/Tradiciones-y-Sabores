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

print("=== VERIFICANDO BASE DE DATOS POSTGRESQL EN VPS ===")
sql_queries = """
su - postgres -c "psql -d restaurant_equis -c '
SELECT count(*) AS total_platos FROM plato;
SELECT id_plato, nombre, precio, categoria FROM plato LIMIT 5;
SELECT count(*) AS total_mesas FROM mesa;
SELECT count(*) AS total_clientes FROM cliente;
SELECT count(*) AS total_insumos FROM \"Inventario\".\"Insumos\";
SELECT count(*) AS total_proveedores FROM \"Inventario\".\"Proveedores\";
'"
"""

stdin, stdout, stderr = client.exec_command(sql_queries)
out = stdout.read().decode('utf-8', errors='ignore')
err = stderr.read().decode('utf-8', errors='ignore')

print("\n=== RESULTADO DE CONSULTAS EN POSTGRESQL ===")
print(out)
if err:
    print("\n=== STDERR ===")
    print(err)

client.close()
