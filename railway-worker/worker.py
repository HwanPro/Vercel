import os
import time
from datetime import datetime, timedelta, timezone

import psycopg
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

# === Config ===
DB_URL = os.environ.get("DATABASE_URL")
if not DB_URL:
    raise RuntimeError("DATABASE_URL no está configurada")

# Lima UTC-5 fijo
LIMA = timezone(timedelta(hours=-5))

# Cambia "attendance" si tu tabla está mapeada con otro nombre
TABLE = "attendance"   # <- si usas Prisma con @@map puede ser "Attendance"


def close_open_attendance():
    """Cierra registros abiertos del día según horario:
       L-V a las 22:00, Sáb a las 20:00.
       Corre en cada invocación con la hora actual de Lima.
    """
    now = datetime.now(LIMA)
    dow = now.weekday()  # 0=lunes ... 6=domingo

    closing_hhmm = None
    if dow in (0, 1, 2, 3, 4):         # L-V
        closing_hhmm = (22, 0)         # 22:00
    elif dow == 5:                      # Sábado
        closing_hhmm = (20, 0)         # 20:00

    if not closing_hhmm:
        print("[AUTO-CLOSE] Domingo, no hay cierre programado.")
        return

    # Ventana del día (en UTC para Postgres)
    start_lima = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_lima   = now.replace(hour=23, minute=59, second=59, microsecond=999000)

    # Convertimos a UTC (si tu DB está en UTC; con timestamptz esto es fiable)
    start_utc = start_lima.astimezone(timezone.utc)
    end_utc   = end_lima.astimezone(timezone.utc)

    hh, mm = closing_hhmm
    try:
        with psycopg.connect(DB_URL) as conn, conn.cursor() as cur:
            # Cierra lo que esté abierto hoy y cuya hora local ya pasó
            cur.execute(
                f"""
                UPDATE {TABLE}
                   SET "checkOutTime" = NOW(),
                       "durationMins" =
                         GREATEST(
                           0,
                           EXTRACT(EPOCH FROM (NOW() - "checkInTime"))::int / 60
                         )
                 WHERE "checkOutTime" IS NULL
                   AND "checkInTime" BETWEEN %s AND %s
                   AND EXTRACT(HOUR   FROM (NOW() AT TIME ZONE 'America/Lima')) >= %s
                   AND EXTRACT(MINUTE FROM (NOW() AT TIME ZONE 'America/Lima')) >= %s
                """,
                (start_utc, end_utc, hh, mm),
            )
            print(f"[AUTO-CLOSE] filas actualizadas: {cur.rowcount}")
            conn.commit()
    except Exception as e:
        print(f"[AUTO-CLOSE][ERROR] {e}")


def main():
    # Ejecuta una vez al iniciar (por si el scheduler arranca después de la hora)
    close_open_attendance()

    # Scheduler:
    # 1) cada 10 minutos como red de seguridad
    # 2) exacto a las 22:00 L-V
    # 3) exacto a las 20:00 Sáb
    sched = BlockingScheduler(timezone="America/Lima")
    sched.add_job(close_open_attendance, CronTrigger(minute="*/10"))
    sched.add_job(close_open_attendance, CronTrigger(hour=22, minute=0, day_of_week="mon-fri"))
    sched.add_job(close_open_attendance, CronTrigger(hour=20, minute=0, day_of_week="sat"))
    print("[SCHED] worker iniciado")
    try:
        sched.start()
    except (KeyboardInterrupt, SystemExit):
        print("[SCHED] detenido")


if __name__ == "__main__":
    main()
