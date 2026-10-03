import csv
import json
import os
import urllib.request
import time

def process():
    csv_path = 'ingredientsnetwork_companies.csv'
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found")
        return

    with open(csv_path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        raw_rows = list(reader)

    print(f"Read {len(raw_rows)} rows from {csv_path}")

    processed = []
    for i, r in enumerate(raw_rows, start=1):
        name = (r.get('Company Name') or '').strip()
        desc = (r.get('Company Description') or '').strip()
        markets = (r.get('Sales Markets') or '').strip()
        activity = (r.get('Primary Business Activity') or '').strip()
        cats = (r.get('Categories') or '').strip()
        events = (r.get('Events') or '').strip()
        address = (r.get('Address') or '').strip()
        email = (r.get('Email') or '').strip()
        tel = (r.get('Telephone') or '').strip()
        website = (r.get('Website') or '').strip()
        profile_url = (r.get('Profile URL') or '').strip()

        cats_lower = cats.lower()
        has_herbs = 'herb' in cats_lower or 'spice' in cats_lower
        has_delivery = any(k in cats_lower for k in [
            'dosage format', 'physical format', 'capsule', 'tablet', 
            'gumm', 'powder', 'sachet', 'liquid', 'granule', 'pellet'
        ])
        in_cognitive = 'cognitive' in cats_lower or 'mental health' in cats_lower

        # Extract specific delivery formats
        formats_found = []
        for fmt in ['Capsules', 'Tablets', 'Gummies', 'Powders', 'Liquids', 'Sachets', 'Granules', 'Pellets', 'Softgels', 'Spray drying', 'Encapsulating']:
            if fmt.lower() in cats_lower:
                formats_found.append(fmt)
        delivery_formats_str = ", ".join(formats_found) if formats_found else ("Standard Formats" if has_delivery else "None")

        # Category items count
        cat_items = [c.strip() for c in cats.split(';') if c.strip()]
        ingredients_cnt = len(cat_items) if cat_items else (1 if name else 0)
        
        # Finished products count
        finished_items = [c for c in cat_items if any(k in c.lower() for k in ['finished', 'supplement', 'beverage', 'confectionery', 'bakery', 'pet food'])]
        finished_cnt = len(finished_items)

        item = {
            "id": f"ING-{str(i).zfill(4)}",
            "company_name": name,
            "company_description": desc or "Global ingredients and nutraceutical supplier.",
            "sales_markets": markets or "Global",
            "primary_business_activity": activity or "Manufacturer: Ingredients / Additives",
            "categories": cats or "Nutritional Ingredients",
            "events": events or None,
            "address": address or "International Directory Listing",
            "email": email or None,
            "telephone": tel or None,
            "website": website or (profile_url if profile_url else None),
            "profile_url": profile_url or None,
            "has_herbs_and_spices": has_herbs,
            "has_physical_delivery_formats": has_delivery,
            "delivery_formats": delivery_formats_str,
            "in_cognitive_mental_health": in_cognitive,
            "health_wellness_focus": "Cognitive & Mental Health" if in_cognitive else ("Botanical Wellness" if has_herbs else "General Nutrition"),
            "ingredients_count": ingredients_cnt,
            "finished_products_count": finished_cnt,
            "logo_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80"
        }
        processed.append(item)

    print(f"Processed {len(processed)} items.")
    print(f"Herbs & Spices: {sum(1 for p in processed if p['has_herbs_and_spices'])}")
    print(f"Delivery Formats: {sum(1 for p in processed if p['has_physical_delivery_formats'])}")
    print(f"Cognitive Health: {sum(1 for p in processed if p['in_cognitive_mental_health'])}")

    # Save to data/ and web-app/src/data/
    os.makedirs('data', exist_ok=True)
    os.makedirs(os.path.join('web-app', 'src', 'data'), exist_ok=True)

    with open(os.path.join('data', 'ingredients_network.json'), 'w', encoding='utf-8') as f:
        json.dump(processed, f, indent=2, ensure_ascii=False)

    with open(os.path.join('web-app', 'src', 'data', 'ingredients_network.json'), 'w', encoding='utf-8') as f:
        json.dump(processed, f, indent=2, ensure_ascii=False)

    print("Saved JSON files successfully!")

if __name__ == '__main__':
    process()
