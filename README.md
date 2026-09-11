# 🌾 KoolKisaan Pro

KoolKisaan Pro is an offline-first AI precision agriculture web application designed to deliver farmer advisory services, plant disease diagnostics, post-harvest storage analytics, and geo-spatial market intelligence.

---

## ✨ Key Features

- **NLP Query Triage & Search**: Classifies farmer questions by domain intent and retrieves relevant agricultural advisories using semantic matching.
- **Multilingual Voice AI**: Integrated speech-to-text input and audio narration across 7 regional languages (*Hindi, Punjabi, Marathi, Telugu, Bengali, Gujarati, English*).
- **AI Crop Doctor**: Visual diagnostic scanner for foliar plant diseases providing organic and chemical IPM remedies.
- **Storage Digital Twin**: Microclimate simulator computing crop shelf life, decay risk, and financial loss forecaster.
- **Geo-Spatial GIS & Mandi APMC**: Interactive state query heatmaps and real-time commodity market price ticker.
- **Digital Prescription Slip**: Printable and shareable advisory prescription slips with verification QR codes.
- **Role-Based Access Control (RBAC)**: Segregated permissions for Admin (full CRUD and disk sync) and Standard User (read-only dashboard access).

---

## 🚀 Advanced Capabilities

- **Physics-Based Spoilage Simulation**: Multi-variable ambient telemetry model (temperature 5–45°C, relative humidity 20–95%, ventilation type, packaging medium) predicting safe storage hours and financial Value-at-Risk.
- **30-Day Mandi Price Trend & Optimal Selling Window**: Predictive market momentum engine forecasting 3-day to 21-day Mandi price projections and identifying the optimal liquidation window to maximize net farmer revenue.
- **Vision Diagnostics & Dual IPM Prescriptions**: Canvas scanner calculating foliar infection severity with bounding box overlays and dual biological (bio-pesticides) + chemical remedies.
- **Community Q&A Forum**: Interactive FAQ hub enabling users to submit queries, upvote answers, and receive expert-verified responses.
- **Mandi Commodity Price Arbitrage**: Continuous real-time price ticker tracking APMC market rates across major agricultural hubs.
- **Offline-First Data Sync**: Full client-side execution with local storage caching and Python background disk sync.
- **Dual Theme Engine**: Dynamic switching between Lush Greenery (light) and Dark Carbon modes for field visibility.


---

## ⚡ Quick Start

### Prerequisites
- Python 3.8 or higher
- Any modern web browser

### Setup & Launch
1. Start the server:
   ```bash
   python run_server.py
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

---

## 🔐 Default Credentials

| Role | Username | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full CRUD privileges, dataset management, disk sync |
| **Standard User** | `user` | `user123` | Read-only access to dashboards, tools, and analytics |

---

## 📁 Project Structure

```
iitr/
├── index.html          # Main SPA interface & dashboard views
├── styles.css          # Core CSS styling & design system
├── app.js              # State manager, UI controller & RBAC routes
├── retriever.js        # TF-IDF query classifier & search engine
├── voice_assistant.js  # Voice STT dictation & TTS narration engine
├── crop_doctor.js      # Disease diagnostic scanner & IPM prescriptions
├── digital_twin.js     # Storage microclimate & shelf-life forecaster
├── geo_map.js          # Interactive SVG GIS map & Mandi price ticker
├── run_server.py       # Python HTTP server & database persistence
└── data/               # Aggregated JSON datasets & stats
```

---

## 📄 License

This project is licensed under the MIT License.

