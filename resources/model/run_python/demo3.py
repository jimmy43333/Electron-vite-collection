import time
import json

time.sleep(5)
data = {
    "status": "ok",
    "numbers": [1, 2, 3],
    "info": {"name": "Demo", "version": 1}
}

print(json.dumps(data))