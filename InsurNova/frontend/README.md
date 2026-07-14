# InsurNova Frontend - AI Experience Center

This is the interactive dashboard for the InsurNova Parametric Insurance platform. It features a high-performance "Glassmorphism" dark theme and real-time ML integrations.

## 🚀 Quick Start for Judges

No database setup is required to explore the UI. We have built-in **AI Mocks** that activate automatically if the backend is unreachable.

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

The app will be available at: **http://localhost:5173**

---

## 🔑 Demo Access
On the Login screen, click the **"Enter Demo Mode (No Login Required)"** button. 
This bypasses authentication and populates the dashboard with:
- ✅ Live claim history
- ✅ ML Simulator access
- ✅ Full GPS Fraud Map functionality

---

## 🛠️ Key Dashboard Sections

1.  **Dashboard**: Overview of risk scores, wallet balances, and active policy widgets.
2.  **ML Simulator**: Select a gig worker profile and run a scikit-learn model simulation.
3.  **GPS Fraud Map**: View spoofing detection in action on a Leaflet interactive map.
4.  **Claims**: Inspect detailed fraud evidence and autonomous payout logic.

---

## ⚙️ Environment Configuration

The app uses the following `.env` variables (pre-configured for local testing):
- `VITE_API_URL`: Backend endpoint (default: :5000)
- `VITE_ML_API_URL`: FastAPI ML endpoint (default: :8000)
- `VITE_SUPABASE_URL`: Auth & User storage

---

**Built with React, Vite, Tailwind, and Framer Motion.**
