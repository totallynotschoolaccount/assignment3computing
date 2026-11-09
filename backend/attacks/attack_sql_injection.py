# attack_sql_injection.py
# Attacks our OWN back end with SQL injection, to show Defence 1 working.
# Only run this against your own laptop.
#
# Start the back end first, then run:  python attacks/attack_sql_injection.py

import httpx

API = "http://127.0.0.1:8000"
VICTIM = "victim-session"
ATTACKER = "attacker-session"

# start clean, so the results are easy to read
httpx.delete(f"{API}/api/history", params={"session_id": VICTIM})
httpx.delete(f"{API}/api/history", params={"session_id": ATTACKER})

# a normal user checks a private link in their own session
secret = "mybank.com.au/statement?account=12345"
httpx.post(f"{API}/api/check", json={"url": secret, "session_id": VICTIM})
print("Victim checked:", secret)
print()

# Attack 1: read everyone's history by changing what the WHERE part of the query means
attack_ids = [
    "' OR '1'='1",
    "x' OR 1=1 --",
    "x' UNION SELECT id,session_id,'',1,1,'','' FROM checks--",
]
for attack in attack_ids:
    r = httpx.get(f"{API}/api/history", params={"session_id": attack})
    rows = r.json() if r.status_code == 200 else []
    leaked = [row["url"] for row in rows]
    print(f"Attack 1 with session_id = {attack}")
    print(f"  status {r.status_code}, rows returned: {len(rows)}")
    if leaked:
        print("  LEAKED:", leaked)
    else:
        print("  nothing leaked")
    print()

# Attack 2: hide a query inside the link itself, so it copies other people's links into ours
attack_url = "x.com/'||(SELECT(group_concat(url))FROM(checks))||'"
r = httpx.post(f"{API}/api/check", json={"url": attack_url, "session_id": ATTACKER})
print(f"Attack 2 with url = {attack_url}")
print(f"  status {r.status_code}")
rows = httpx.get(f"{API}/api/history", params={"session_id": ATTACKER}).json()
stored = rows[0]["url"] if rows else ""
print(f"  what was saved: {stored}")
if secret in stored:
    print("  LEAKED the victim's link")
else:
    print("  saved as plain text, nothing leaked")