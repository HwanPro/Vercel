import win32com.client

def test_device():
    try:
        zk = win32com.client.Dispatch("zkemkeeper.ZKEM")
        connected = zk.Connect_USB(1)  # ID 1 es el dispositivo conectado por USB
        if connected:
            print("✅ Dispositivo conectado correctamente")
            print("Versión SDK:", zk.GetSDKVersion())
        else:
            print("❌ No se pudo conectar al dispositivo")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_device()
