# test_capture.py
from fingerprint_service.zk_device import ZKDevice
d = ZKDevice()
assert d.init() == 0
assert d.get_count() > 0
assert d.open(0) == 0
ok, res = d.capture_template()
print("CAPTURE:", ok, res if ok else res["message"])
d.close(); d.terminate()
