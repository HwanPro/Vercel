import os, ctypes

CANDIDATES = [
    r"C:\Windows\System32\libzkfp.dll",
    r"C:\Windows\System32\zkfinger10.dll",
    r"C:\Windows\System32\ZKFPCap.dll",
    # agrega aquí las rutas absolutas que te mostró el paso 1
    r"D:\DiscoE\new-gym\libzkfp.dll",
    r"D:\DiscoE\new-gym\zkfinger10.dll",
    r"D:\DiscoE\new-gym\ZKFPCap.dll",
]

SYMS = [
    "ZKFPM_Init",
    "ZKFPM_Terminate",
    "ZKFPM_GetDeviceCount",
    "ZKFPM_OpenDevice",
    "ZKFPM_CloseDevice",
    "ZKFPM_AcquireFingerprint",
    "AcquireFingerprint",
    "AcquireTemplate",
    "Init",
    "OpenDevice",
]

for p in CANDIDATES:
    if not p or not os.path.exists(p):
        continue
    try:
        dll = ctypes.WinDLL(p)
        ok = []
        for s in SYMS:
            try:
                getattr(dll, s)
                ok.append(s)
            except AttributeError:
                pass
        print(f"\nDLL: {p}")
        if ok:
            print("  Exporta:", ", ".join(ok))
        else:
            print("  No exporta símbolos conocidos de captura.")
    except Exception as e:
        print(f"\nDLL: {p}\n  ERROR cargando: {e}")
