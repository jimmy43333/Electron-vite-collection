import json
import time
time.sleep(3)
print("This is demo2 result", flush=True)
time.sleep(1)

print("Demo2 check first thing...", flush=True)
time.sleep(1)
data = {
    "device": "Power",
    "status": True,
}
print(json.dumps(data),  flush=True)
time.sleep(1)

print("Demo2 check second thing...", flush=True)
time.sleep(1)
data = {
    "device": "Chiller",
    "status": True,
}
print(json.dumps(data),  flush=True)
time.sleep(1)

print("Demo2 check third thing...", flush=True)
time.sleep(1)
data = {
    "device": "Relay",
    "status": True,
}
print(json.dumps(data),  flush=True)
time.sleep(1)

print("Demo2 check last thing...", flush=True)
time.sleep(1)
data = {
    "device": "DUT",
    "status": False,
}
print(json.dumps(data),  flush=True)
time.sleep(1)

data = {
    "device": "Chamber",
    "status": False,
}
print(json.dumps(data),  flush=True)