<<<<<<< HEAD
# 🚀 InsurNova

**AI-Powered Parametric Insurance Platform for Gig Workers**

InsurNova is an automation-first insurance platform where claims are triggered automatically based on real-world events (weather, AQI, government alerts). No manual claim submission required.

## 🌟 Features

- **Zero Manual Claims**: Events auto-trigger the claim pipeline
- **AI Agent System**: Automated risk evaluation, exclusion checking, and fraud detection
- **Glassmorphism UI**: Modern frosted glass design with environmental animations
- **Real-time Processing**: Event → Risk → Exclusion → Claim → Payout pipeline
- **Transparent Decisions**: Every claim decision shows clear reasoning

## 🏗️ Architecture

```
/InsurNova
  ├── /frontend       # Next.js 14 + Tailwind + Glassmorphism UI
  ├── /backend        # Express API + JWT Auth + Agent Services
  ├── /mock-apis      # Simulated weather/AQI/govt APIs
  └── /database       # MongoDB Docker configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- MongoDB

### 1. Setup Database

```bash
cd database
docker-compose up -d
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. Setup Mock APIs

```bash
cd mock-apis
npm install
npm run dev
```

### 4. Setup Frontend

=======
# InsurNova - AI-Powered Parametric Insurance Platform

> **Judge's Note:** InsurNova is designed with a "Database-Optional" architecture. You can run the Frontend immediately to explore all features using our robust AI fallback/demo system without setting up a database.

---

## 🚀 Quick Execution Guide (Judge's Path)

### 1. Frontend & Demo Mode (Easiest)
Run the UI to explore the Dashboard, ML Simulator, and the **new GPS Fraud Map**.
>>>>>>> 7887c9b (Initialize InsurNova with Advanced Fraud Detection and Dark UI)
```bash
cd frontend
npm install
npm run dev
```
<<<<<<< HEAD

### 5. Access the App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Mock APIs**: http://localhost:5001

## 🎨 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, JWT Authentication
- **Database**: MongoDB with Mongoose ODM
- **Containerization**: Docker & Docker Compose
- **Animations**: Framer Motion, CSS Animations, Canvas

## 🧠 Agent Services

The backend implements specialized services for automation:

- **riskService**: Evaluates event severity and calculates risk scores
- **exclusionService**: Checks if events fall under excluded categories
- **fraudService**: Validates event authenticity and user trust scores
- **claimService**: Orchestrates the complete decision pipeline
- **pricingService**: Calculates premiums based on coverage and risk

## 📊 Event Pipeline

```
Incoming Event
    ↓
Risk Evaluation
    ↓
Exclusion Check
    ↓
Fraud Detection
    ↓
Claim Decision
    ↓
Automated Payout
```

## 🎯 Covered Events

- 🌧️ Heavy Rain
- 🌡️ Extreme Heat
- 🌫️ Air Pollution (AQI)
- 🚨 Government Curfews

## ❌ Exclusions

For financial sustainability, the following are excluded:
- War & Terrorism
- Pandemics
- Major National Lockdowns

## 📄 License

MIT

## 🤝 Contributing

This is a prototype demonstration project.

---

Built with ❤️ for the future of gig worker protection
=======
*   **Demo Access:** Use the **"Enter Demo Mode"** button on the Login page to bypass authentication and explore the platform with live-calculating AI mocks.

### 2. ML Inference Engine (Optional but Recommended)
Run the scikit-learn model servers to see real-time predictions in the **AI Live Monitor**.
```bash
# In a new terminal
cd ml
pip install -r requirements.txt
python inference/app.py 
# Runs on :8000
```

### 3. Backend (Optional)
Connect to the Node.js orchestrator (requires Supabase/MongoDB credentials in .env).
```bash
cd InsurNova/backend
npm install
npm start
# Runs on :5000
```

---

## 🎨 Key Features to Evaluate

### 🧠 1. Real-Time ML Simulator
Navigate to the **Simulator** page. Adjust event parameters (rainfall, severity, duration) and see four ML models (`GBB`, `GBR`, `Ridge`, `XGB`) predict risk, churn, and pricing in legal-compliant milliseconds.

### 🔍 2. Advanced GPS Fraud Map
Visit the **GPS Fraud Map** to see our new fraud detection system.
*   **Impossible Velocity Detection:** Identifies spoofed coordinates (e.g., traveling at 16,000 km/h).
*   **AI Fraud Scan:** Click "Run Scan" to see the Agentic system analyze device fingerprints and location anomalies in a real-time terminal log.

### ⚡ 3. Agentic Architecture
Our **Orchestrator Agent** coordinates 10 specialized agents:
- **Risk Agent:** Quantifies probability.
- **Fraud Agent:** Detects spoofing.
- **Wallet Agent:** Integrates with **Razorpay**.
- **Explanation Agent:** Generates human-readable payout logic.

---

## 🛠️ Environment Setup

A `.env.example` is provided in the root. For full functionality, copy it to the respective directories:

| Component | Port | Required Keys |
|---|---|---|
| **Frontend** | 5173 | `VITE_API_URL`, `VITE_SUPABASE_URL` |
| **Backend** | 5000 | `MONGO_URI`, `JWT_SECRET`, `RAZORPAY_KEY` |
| **ML API** | 8000 | Python 3.11+ |

---

## 📂 Project Architecture

```
InsurNova/
├── agents/             # Agentic logic (Risk, Fraud, Claim, etc.)
├── ml/                 # ML Models & FastAPI Inference Engine
├── InsurNova/backend/  # Node.js REST API
└── frontend/           # React + Tailwind Dashboard
```

---

## ✅ Success Checklist

- [ ] **Frontend Runs:** Dashboard loads with glassy dark-mode UI.
- [ ] **ML Monitor:** Gauges move when simulators are triggered.
- [ ] **Fraud Map:** Impossible velocity flags are visible on the interactive map.
- [ ] **Payments:** Razorpay modal triggers on plan selection.

**Built for the future of Gig-Economy Protection.**
>>>>>>> 7887c9b (Initialize InsurNova with Advanced Fraud Detection and Dark UI)
