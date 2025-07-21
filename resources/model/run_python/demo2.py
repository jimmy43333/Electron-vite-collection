import json
import time
time.sleep(3)
print("This is demo2 result", flush=True)
time.sleep(2)
print("Demo2 check first thing...", flush=True)
time.sleep(2)
print("Demo2 check second thing...", flush=True)
time.sleep(2)
print("Demo2 check third thing...", flush=True)
time.sleep(2)
print("Demo2 check last thing...", flush=True)

data = {
    "status": "ok",
    "numbers": [1, 2, 3, 4],
    "info": {"step1": "Pass", "step2": "Pass", "step3": "Fail", "step4": "Fail"}
}

print(json.dumps(data))