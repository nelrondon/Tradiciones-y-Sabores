"""
fix_postgres_remote.py — Configura PostgreSQL para aceptar conexiones remotas
Necesario para que Vercel pueda conectarse desde la nube al VPS Contabo
"""
import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

HOST     = "158.220.100.226"
PORT     = 22
USER     = "root"
PASSWORD = "1415162013asd"

PG_CONF  = "/etc/postgresql/16/main/postgresql.conf"
PG_HBA   = "/etc/postgresql/16/main/pg_hba.conf"

def run(client, cmd):
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    if out: print(out.strip())
    if err: print(f"[stderr] {err.strip()}")
    return out, err

def main():
    print(f"Conectando a {HOST}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)
    print("[OK] Conexión SSH establecida\n")

    # 1. Mostrar config actual
    print("=== Config actual listen_addresses ===")
    run(client, f"grep listen_addresses {PG_CONF}")

    # 2. Cambiar listen_addresses = '*'
    print("\n=== Cambiando listen_addresses a '*' ===")
    run(client, f"perl -i -pe \"s/#?listen_addresses\\s*=\\s*'localhost'/listen_addresses = '*'/\" {PG_CONF}")
    run(client, f"grep listen_addresses {PG_CONF}")

    # 3. Agregar regla en pg_hba.conf (solo si no existe)
    print("\n=== Agregando regla acceso remoto en pg_hba.conf ===")
    out, _ = run(client, f"grep '0.0.0.0/0' {PG_HBA}")
    if "0.0.0.0/0" not in out:
        run(client, f"echo 'host all all 0.0.0.0/0 md5' >> {PG_HBA}")
        print("[OK] Regla agregada.")
    else:
        print("[OK] Regla ya existe, no se duplica.")

    # 4. Verificar que el usuario postgres tenga password
    print("\n=== Asegurando password del usuario postgres ===")
    run(client, "sudo -u postgres psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\"")

    # 5. Reiniciar PostgreSQL
    print("\n=== Reiniciando PostgreSQL ===")
    run(client, "systemctl restart postgresql")
    run(client, "systemctl status postgresql --no-pager | head -5")

    # 6. Verificar que escucha en *:5432
    print("\n=== Verificando puerto 5432 ===")
    run(client, "ss -tlnp | grep 5432")

    print("\n=== LISTO — PostgreSQL acepta conexiones remotas ===")
    print(f"Host:     {HOST}")
    print("Puerto:   5432")
    print("DB:       restaurant_equis")
    print("Usuario:  postgres")
    print("Password: postgres")

    client.close()

if __name__ == "__main__":
    main()
