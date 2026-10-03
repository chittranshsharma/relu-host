import json
import urllib.request
import time
import os

env = {}
with open(os.path.join('web-app', '.env'), 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip()

with open(os.path.join('data', 'finalresults.json'), 'r', encoding='utf-8') as f:
    rows = json.load(f)

print(f"Total rows: {len(rows)}")
batch = rows[150:]
print(f"Uploading remaining {len(batch)} rows...")

url = f"{env['VITE_SUPABASE_URL']}/rest/v1/disney_cruises_final"
headers = {
    'apikey': env['VITE_SUPABASE_ANON_KEY'],
    'Authorization': f"Bearer {env['VITE_SUPABASE_ANON_KEY']}",
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}

req = urllib.request.Request(url, data=json.dumps(batch).encode('utf-8'), headers=headers, method='POST')
for attempt in range(3):
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"Upload remaining: HTTP {resp.status}")
            break
    except Exception as e:
        print(f"Attempt {attempt+1} failed: {e}")
        time.sleep(2)
