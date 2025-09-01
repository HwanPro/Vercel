from zk import ZK, const
import time

class FingerprintService:
    def __init__(self, device_ip="192.168.1.201", port=4370):
        self.device_ip = device_ip
        self.port = port

    def connect(self):
        zk = ZK(self.device_ip, port=self.port, timeout=5, password=0, force_udp=False, ommit_ping=False)
        conn = zk.connect()
        return conn

    def enroll_user(self, user_id, name):
        conn = self.connect()
        try:
            conn.enroll_user(uid=user_id, name=name)
            print(f"✅ Huella registrada para {name}")
        finally:
            conn.disconnect()

    def verify_user(self):
        conn = self.connect()
        try:
            attendance = conn.get_attendance()
            for att in attendance:
                print(f"Usuario: {att.user_id} - Hora: {att.timestamp}")
            return attendance
        finally:
            conn.disconnect()
