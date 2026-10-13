# 🌾 RythuRaksha AI — Climate-Smart Crop Insurance & Loan Assistant
**VNR VJIET AI Engineering Hackathon | Team 33**  
**Architecture**: Dual-Portal + Tri-Agent AI System (`React + Vite + Tailwind CSS + FastAPI + SQLite + Hugging Face + Open-Meteo + Leaflet + ReportLab`)

---

## 🎯 Architecture & End-to-End Workflow

```
FARMER PORTAL
  │ Select Verified Telangana Crop & Field (Leaflet Map)
  │ Report Weather Event (e.g., Sept 2024 Heavy Rainfall)
  ▼
AGENT 1: CROP DAMAGE INTELLIGENCE (backend/weather.py + backend/satellite.py)
  │ Real Open-Meteo Historical Weather API + Verified Sentinel-2 L2A Bands (B8, B4)
  │ Dynamic NDVI Calculation: NDVI = (B8 - B4) / (B8 + B4)
  ▼
AGENT 2: HUGGING FACE FINANCIAL AI (backend/agents.py + backend/pdf_generator.py)
  │ Generates Crop Insurance Claim Draft OR Loan Relief Request Draft
  │ Exports Downloadable Single-Page ReportLab PDF
  ▼
BANK / INSURER REVIEWER PORTAL (InstitutionDashboard.tsx)
  │ Inspects Weather, Satellite & AI Draft Evidence
  │ Updates Case Status (Pending Review -> Under Review -> Completed) in SQLite
  ▼
AGENT 3: TELUGU AI ASSISTANT (TeluguAssistant.tsx)
  │ Explains Crop Condition, Claim Status & Loan Relief Steps in Simple Telugu (Text + te-IN Voice)
```

---

## 📁 Project File Structure

```text
RYTHURAKSHA/
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── LandingPage.tsx
│       │   ├── FarmerDashboard.tsx
│       │   ├── DamageAnalysis.tsx
│       │   ├── ClaimPage.tsx
│       │   └── InstitutionDashboard.tsx
│       ├── components/
│       │   ├── FieldMap.tsx
│       │   ├── WeatherChart.tsx
│       │   └── TeluguAssistant.tsx
│       └── services/
│           └── api.ts
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── weather.py
│   ├── satellite.py
│   ├── agents.py
│   ├── pdf_generator.py
│   ├── requirements.txt
│   └── .env
├── demo_data/
│   ├── field.geojson
│   ├── verified_satellite_data.json
│   └── satellite_sources.md
└── README.md
```

---

## 🚀 Quick Start Instructions

### 1. Start the FastAPI Backend (`Port 8000`)
```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- Health check: `http://localhost:8000/api/health`
- Interactive Swagger docs: `http://localhost:8000/docs`

### 2. Start the React + Vite Frontend (`Port 5173`)
```powershell
cd frontend
npm install
npm run dev
```
- Open `http://localhost:5173` in your browser.

---

## 🔌 API Endpoints (`CP-06 Contract`)

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Check backend, SQLite, and Hugging Face readiness |
| `/api/fields` | `GET` | Get verified Telangana agricultural fields & GeoJSON |
| `/api/weather` | `GET` | Fetch real Open-Meteo historical rainfall & temperature |
| `/api/incidents` | `POST` | Report crop damage incident and create SQLite case |
| `/api/assessments/{id}` | `POST` | Run Agent 1 (Open-Meteo + Sentinel-2 NDVI) |
| `/api/claims/draft` | `POST` | Run Agent 2 (Hugging Face Insurance / Loan Relief draft) |
| `/api/claims/{id}/submit` | `POST` | Submit case to Institutional Reviewer Portal |
| `/api/cases` | `GET` | Retrieve synchronized case list & summary counts |
| `/api/cases/{id}/status` | `PATCH` | Institutional reviewer updates status & comments |
| `/api/assistant/query` | `POST` | Run Agent 3 (Telugu AI Assistant grounded on SQLite) |
| `/api/claims/{id}/pdf` | `GET` | Download ReportLab single-page PDF dossier |
