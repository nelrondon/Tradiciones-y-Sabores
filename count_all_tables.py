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

print("=== CONTEO DE FILAS EN POSTGRESQL SERVIDOR PROD ===")
tables = [
    ("public", "plato"),
    ("public", "mesa"),
    ("public", "cliente"),
    ("public", "pedido"),
    ("public", "detalle_pedido"),
    ("public", "factura"),
    ("Inventario", "Insumos"),
    ("Inventario", "Proveedores"),
    ("Inventario", "Categoria"),
]

for schema, tbl in tables:
    cmd = f'su - postgres -c "psql -d restaurant_equis -t -c \\"SELECT count(*) FROM \\\\"{schema}\\\\".\\\\"{tbl}\\\\\\";\\""'
    stdin, stdout, stderr = client.exec_command(cmd)
    count = stdout.read().decode().strip()
    print(f"  • Tabla {schema}.{tbl}: {count} registros")

client.close()
