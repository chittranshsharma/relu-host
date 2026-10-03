import json
import os
import urllib.request
import time

env = {}
with open(os.path.join('web-app', '.env'), 'r', encoding='utf-8') as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            k, v = line.strip().split('=', 1)
            env[k] = v

with open(os.path.join('data', 'ingredients_network.json'), 'r', encoding='utf-8') as f:
    records = json.load(f)

# Allowed columns matching supabase schema.sql
allowed_cols = {
    'id', 'company_name', 'company_description', 'sales_markets',
    'primary_business_activity', 'categories', 'events', 'address',
    'email', 'telephone', 'website', 'has_herbs_and_spices',
    'has_physical_delivery_formats', 'delivery_formats',
    'in_cognitive_mental_health', 'health_wellness_focus',
    'ingredients_count', 'finished_products_count', 'logo_url'
}

sanitized_records = []
for r in records:
    clean_r = {}
    for col in allowed_cols:
        val = r.get(col)
        # Ensure string columns aren't None if schema might expect a string
        if val is None and col in ['company_description', 'sales_markets', 'primary_business_activity', 'categories', 'address']:
            val = "N/A"
        clean_r[col] = val
    if not clean_r['website'] and r.get('profile_url'):
        clean_r['website'] = r.get('profile_url')
    sanitized_records.append(clean_r)

print(f"Total sanitized records: {len(sanitized_records)}")

url = f"{env['VITE_SUPABASE_URL']}/rest/v1/ingredients_network"
headers = {
    'apikey': env['VITE_SUPABASE_ANON_KEY'],
    'Authorization': f"Bearer {env['VITE_SUPABASE_ANON_KEY']}",
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
}

batch_size = 100
for i in range(0, len(sanitized_records), batch_size):
    batch = sanitized_records[i:i + batch_size]
    print(f"Uploading batch {i//batch_size + 1} ({len(batch)} records)...")
    req = urllib.request.Request(
        url,
        data=json.dumps(batch).encode('utf-8'),
        headers=headers,
        method='POST'
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                print(f"  Batch {i//batch_size + 1} succeeded: HTTP {resp.status}")
                break
        except Exception as e:
            print(f"  Attempt {attempt + 1} error: {e}")
            if hasattr(e, 'read'):
                try:
                    print("  Server response:", e.read().decode('utf-8'))
                except Exception:
                    pass
            time.sleep(2)

print("Finished syncing all ingredients records to Supabase!")
