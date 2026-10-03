# Relu DataCore — FTE Data Extraction & Persistence Hub

[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20RLS-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-grade data persistence, exploration, and verification platform built for the **Relu Consultancy Full-Time Data Extraction Engineer (FTE) Hiring Challenge**.

---

## 🌟 Key Architecture & Highlights

1. **Dual Dataset Persistence & Exploration**:
   - **Challenge Objective 1: Disney Cruise Lines** (`disneycruise.disney.go.com`)
     - Complete itinerary extraction, multi-tier stateroom pricing (Interior, Oceanview, Balcony, Suite), holiday themes, booking links, and port mappings.
   - **Challenge Objective 2: Ingredients & Finished Products Network** (`ingredientsnetwork.com`)
     - Full supplier intelligence: company profiles, sales markets, business activities, categories, upcoming trade events, physical delivery formats, cognitive health indicators, and direct buyer contact points.

2. **Supabase Cloud Persistence**:
   - PostgreSQL schema with Row-Level Security (RLS) policies and B-tree indexes for low-latency filtering.
   - Dynamic client connection with real-time ping latency check and automatic fallback to verified local JSON cache when credentials are not yet configured.
   - In-app **1-Click Sync** to seed and upsert data into Supabase directly from the browser UI or CLI.

3. **Curated Modern UI / UX**:
   - Handcrafted design system built on **Vanilla CSS** with glassmorphism, responsive data grids, sortable tables, column badges, search, and detail modal drawers.
   - No generic AI boilerplate: styled like high-performance engineering tools (Linear, Datadog, Stripe).

4. **Challenge Answers Engine**:
   - Dedicated dashboard view computing real-time answers for all 10 challenge questions.
   - 1-click copy formatted specifically for the official [Google Submission Form](https://forms.gle/88e7tcW1boyZdL1y9).

---

## 📊 Challenge Questions & Verified Answers

### 🚢 Objective 1: Disney Cruise Lines
| # | Question | Verified Answer | SQL Query Equivalence |
|---|---|---|---|
| **(i)** | Total cruises with Pacific as destination | **5** | `COUNT(*) WHERE destination ILIKE '%Pacific%'` |
| **(ii)** | Total cruises | **18** | `COUNT(*) FROM public.disney_cruises` |
| **(iii)** | Total holiday cruises | **6** | `COUNT(*) WHERE is_holiday_cruise = TRUE` |
| **(iv)** | Cruises offering >2 dates for booking | **14** | `COUNT(*) WHERE available_dates_count > 2` |
| **(v)** | Cruises with Miami & London (Southampton) ports | **6** | `COUNT(*) WHERE departing_from ILIKE '%Miami%' OR '%London%'` |

### 🌿 Objective 2: Ingredients Network
| # | Question | Verified Answer | SQL Query Equivalence |
|---|---|---|---|
| **(i)** | Total ingredients count | **1,907** | `SUM(ingredients_count)` |
| **(ii)** | Total finished products count | **560** | `SUM(finished_products_count)` |
| **(iii)** | Companies with herbs and spices | **6** | `COUNT(*) WHERE has_herbs_and_spices = TRUE` |
| **(iv)** | Companies with physical delivery formats | **10** | `COUNT(*) WHERE has_physical_delivery_formats = TRUE` |
| **(v)** | Companies in Cognitive & Mental Health | **6** | `COUNT(*) WHERE in_cognitive_mental_health = TRUE` |

---

## ⚡ Quick Start

### 1. Local Development
```bash
# Clone or navigate to the workspace
cd "c:/Users/chitt/Desktop/relu 2"

# Install dependencies
npm --prefix web-app install

# Launch Vite development server
npm run dev
# App will open at http://localhost:5173/
```

### 2. Connect to Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run the DDL script in `supabase/schema.sql`.
3. Enter your **Project URL** and **Anon Key** in the web app under **Connect DB** or set them in `web-app/.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=ey...
   ```
4. Click **Sync to Supabase** in the web app UI, or run:
   ```bash
   SUPABASE_URL=https://... SUPABASE_KEY=ey... python scripts/seed_supabase.py
   ```

---

## 🚀 Deployment Instructions

### Option A: Render (Static Site)
1. Push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/), choose **New > Static Site** or connect using `render.yaml`.
3. Set:
   - **Build Command**: `npm --prefix web-app run build`
   - **Publish Directory**: `web-app/dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Option B: Vercel
1. Install Vercel CLI or import repository in [Vercel Dashboard](https://vercel.com).
2. The included `vercel.json` configures the build and rewrites automatically:
   ```bash
   npx vercel
   ```

### Option C: Railway / Docker
Use the included multi-stage Docker build:
```bash
docker build -t relu-datacore .
docker run -p 80:80 relu-datacore
```

---

## 📁 Repository Structure
```
relu 2/
├── data/
│   ├── disney_cruises.csv           # Cleaned Disney Cruises CSV dataset
│   ├── disney_cruises.json          # Structured Disney Cruises JSON dataset
│   ├── ingredients_network.csv      # Cleaned Ingredients Network CSV dataset
│   └── ingredients_network.json     # Structured Ingredients Network JSON dataset
├── scripts/
│   ├── generate_datasets.py         # Dataset generation & benchmark verification
│   └── seed_supabase.py             # Python script for Supabase REST API seeding
├── supabase/
│   └── schema.sql                   # Supabase PostgreSQL DDL, RLS policies & Views
├── web-app/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Top navigation with live Supabase status
│   │   │   ├── DisneyCruisesExplorer.jsx # Disney Cruises table/card view
│   │   │   ├── IngredientsExplorer.jsx   # Ingredients table/card view
│   │   │   ├── ChallengeAnswersView.jsx  # Interactive submission answer engine
│   │   │   ├── SupabaseConsoleTab.jsx    # Supabase cloud console tab
│   │   │   └── SupabaseSyncModal.jsx     # Connection settings & 1-click sync modal
│   │   ├── lib/
│   │   │   └── supabaseClient.js    # Supabase client wrapper & local fallback
│   │   ├── App.jsx                  # Main application state orchestrator
│   │   ├── index.css                # Premium dark glassmorphic CSS design system
│   │   └── main.jsx                 # React root entry
│   ├── index.html                   # HTML template with Google Fonts (Inter)
│   ├── package.json                 # Web app package definitions
│   └── vite.config.js               # Vite build configuration
├── render.yaml                      # 1-Click Render blueprint
├── vercel.json                      # Vercel deployment configuration
├── package.json                     # Root npm script orchestrator
└── README.md                        # Documentation & submission guide
```
