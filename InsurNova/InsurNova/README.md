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

```bash
cd frontend
npm install
npm run dev
```

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
