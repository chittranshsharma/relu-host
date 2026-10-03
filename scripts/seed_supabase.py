import os
import sys
import json
import urllib.request
import urllib.error

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_ANON_KEY", "")

def upload_table(table_name: str, json_file: str):
    if not SUPABASE_URL or not SUPABASE_KEY:
        print(f"[!] SUPABASE_URL or SUPABASE_KEY not found in environment variables.")
        return False
    
    with open(json_file, 'r', encoding='utf-8') as f:
        records = json.load(f)
    
    endpoint = f"{SUPABASE_URL}/rest/v1/{table_name}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    req = urllib.request.Request(
        endpoint,
        data=json.dumps(records).encode('utf-8'),
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            print(f"[OK] Successfully seeded {len(records)} rows into '{table_name}' (HTTP {resp.status})")
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        print(f"[FAIL] Failed to seed '{table_name}': HTTP {e.code} - {body}")
        return False
    except Exception as e:
        print(f"[ERROR] Network error: {e}")
        return False

def main():
    print("=" * 60)
    print(" Relu Consultancy - Supabase Data Seeding Utility")
    print("=" * 60)
    
    upload_table("disney_cruises", "data/disney_cruises.json")
    upload_table("ingredients_network", "data/ingredients_network.json")
    print("\nDone. Verifying data in Supabase Table Editor...")

if __name__ == "__main__":
    main()
