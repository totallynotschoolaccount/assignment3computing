# attack_dos.py
# Attacks our OWN back end with denial of service, to show Defence 2 working.
# Only run this against your own laptop.
#
# Start the back end first, then run:  python attacks/attack_dos.py

import threading
import time
from concurrent.futures import ThreadPoolExecutor

import httpx

API = "http://127.0.0.1:8000"


def timed_health_check():
    # how long a normal, tiny request takes right now
    start = time.time()
    httpx.get(f"{API}/api/health", timeout=120)
    return time.time() - start


def send_check(url):
    start = time.time()
    r = httpx.post(f"{API}/api/check", json={"url": url, "session_id": "dos-test"}, timeout=120)
    return r.status_code, time.time() - start


print(f"Normal health check: {timed_health_check():.3f} seconds")
print()

# Attack 1: one small crafted link (31 characters) that makes a bad regex try millions of matches
crafted = "a.com/" + "a" * 24 + "!"
print(f"Attack 1: one crafted link: {crafted}")
result = {}
attacker = threading.Thread(target=lambda: result.update(answer=send_check(crafted)))
attacker.start()
time.sleep(0.3)   # give the crafted request a head start
print(f"  health check while the attack runs: {timed_health_check():.3f} seconds")
attacker.join()
status, seconds = result["answer"]
print(f"  the crafted request itself: status {status} after {seconds:.3f} seconds")
print()

# Attack 2: one huge request body (5 MB)
print("Attack 2: one 5 MB request")
start = time.time()
r = httpx.post(f"{API}/api/check", json={"url": "a" * 5_000_000, "session_id": "dos-test"}, timeout=120)
print(f"  status {r.status_code} after {time.time() - start:.3f} seconds")
print()

# Attack 3: 300 checks sent at the same time
print("Attack 3: 300 checks at the same time")
links = [f"example{i}.com/login" for i in range(300)]
with ThreadPoolExecutor(max_workers=100) as pool:
    futures = [pool.submit(send_check, link) for link in links]
    time.sleep(0.2)
    print(f"  health check during the flood: {timed_health_check():.3f} seconds")
    answers = [f.result() for f in futures]
codes = [code for code, _ in answers]
slowest = max(seconds for _, seconds in answers)
print(f"  200 OK: {codes.count(200)}   503 busy: {codes.count(503)}   other: {len(codes) - codes.count(200) - codes.count(503)}")
print(f"  slowest answer: {slowest:.3f} seconds")