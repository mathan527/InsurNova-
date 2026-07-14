# 🚀 InsurNova - Development Environment Setup

## ⚠️ Important: PowerShell Core Not Available

Since PowerShell Core (pwsh) is not installed, please follow these **manual steps** to set up and run the development environment.

---

## 📋 COMPLETE SETUP STEPS

### Step 1: Create Directory Structure

Open Command Prompt in `C:\InsurNova` and run these commands:

```cmd
mkdir backend\models backend\routes backend\services backend\middleware
mkdir mock-apis
mkdir frontend\src\app\login frontend\src\app\signup frontend\src\app\dashboard
mkdir frontend\src\app\policy frontend\src\app\claims frontend\src\app\simulator frontend\src\app\admin
mkdir frontend\src\lib frontend\src\components
mkdir database
```

### Step 2: Copy Backend Files

```cmd
copy server-backend.js backend\server.js
copy package-backend.json backend\package.json
copy env-backend.txt backend\.env

REM Models
copy model-user.js backend\models\User.js
copy model-policy.js backend\models\Policy.js
copy model-claim.js backend\models\Claim.js
copy model-event.js backend\models\Event.js

REM Services
copy service-risk.js backend\services\riskService.js
copy service-exclusion.js backend\services\exclusionService.js
copy service-fraud.js backend\services\fraudService.js
copy service-claim.js backend\services\claimService.js
copy service-pricing.js backend\services\pricingService.js

REM Routes
copy route-auth.js backend\routes\auth.js
copy route-policy.js backend\routes\policy.js
copy route-claims.js backend\routes\claims.js
copy route-events.js backend\routes\events.js
copy route-status.js backend\routes\status.js
copy route-admin.js backend\routes\admin.js

REM Middleware
copy middleware-auth.js backend\middleware\auth.js
```

### Step 3: Copy Frontend Files

```cmd
REM Root config files
copy package-frontend.json frontend\package.json
copy nextconfig.js frontend\next.config.js
copy tsconfig.json frontend\tsconfig.json
copy tailwind.config.js frontend\tailwind.config.js
copy postcss.config.js frontend\postcss.config.js
copy env-frontend.txt frontend\.env.local

REM App files
copy layout.tsx frontend\src\app\layout.tsx
copy page.tsx frontend\src\app\page.tsx
copy globals.css frontend\src\app\globals.css

REM Pages
copy page-login.tsx frontend\src\app\login\page.tsx
copy page-signup.tsx frontend\src\app\signup\page.tsx
copy page-dashboard.tsx frontend\src\app\dashboard\page.tsx
copy page-policy.tsx frontend\src\app\policy\page.tsx
copy page-claims.tsx frontend\src\app\claims\page.tsx
copy page-simulator.tsx frontend\src\app\simulator\page.tsx
copy page-admin.tsx frontend\src\app\admin\page.tsx

REM Lib and Components
copy api.ts frontend\src\lib\api.ts
copy AuthContext.tsx frontend\src\lib\AuthContext.tsx
copy Navbar.tsx frontend\src\components\Navbar.tsx
```

### Step 4: Copy Mock APIs and Database

```cmd
copy server-mock.js mock-apis\server.js
copy package-mock.json mock-apis\package.json
copy docker-compose.yml database\docker-compose.yml
```

### Step 5: Install Dependencies

```cmd
REM Backend
cd backend
npm install
cd ..

REM Mock APIs
cd mock-apis
npm install
cd ..

REM Frontend
cd frontend
npm install
cd ..
```

### Step 6: Start MongoDB

```cmd
cd database
docker-compose up -d
cd ..
```

**Verify MongoDB is running:**
```cmd
docker ps
```
You should see `insurnova-mongodb` container running.

### Step 7: Start Backend API (Terminal 1)

Open a new Command Prompt:
```cmd
cd C:\InsurNova\backend
npm run dev
```

You should see:
```
✓ MongoDB connected successfully
🚀 InsurNova Backend running on port 5000
📡 API available at http://localhost:5000/api
```

### Step 8: Start Mock APIs (Terminal 2)

Open another Command Prompt:
```cmd
cd C:\InsurNova\mock-apis
npm run dev
```

You should see:
```
🌐 Mock APIs running on port 5001
📡 Available at http://localhost:5001
```

### Step 9: Start Frontend (Terminal 3)

Open another Command Prompt:
```cmd
cd C:\InsurNova\frontend
npm run dev
```

You should see:
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
```

---

## ✅ VERIFICATION

### 1. Check All Services

**Backend API:**
- URL: http://localhost:5000/api/health
- Should return: `{"status":"ok","message":"InsurNova API is running"}`

**Mock APIs:**
- URL: http://localhost:5001/health
- Should show available endpoints

**Frontend:**
- URL: http://localhost:3000
- Should show the login page with rain animation

### 2. Test the Application

1. **Open Browser**: http://localhost:3000
2. **Click "Create Account"**
3. **Fill in the form:**
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - Platform: Swiggy
4. **Click "Create Account"**
5. **You should be redirected to the dashboard**

---

## 🎯 WHAT TO TRY

### 1. Dashboard
- View your metrics (earnings, coverage, risk, trust score)
- See live risk monitoring (weather, AQI)
- Check recent claims

### 2. Activate Policy
- Click "Policy" in navbar
- Adjust coverage slider (₹10k - ₹2L)
- See real-time premium calculation
- Click "Activate Plan"

### 3. Simulate Events
- Click "Simulator" in navbar
- Choose event type (Rain, Heat, Pollution, etc.)
- Set severity (0-100%)
- Click "Simulate Event"
- Watch the automated decision pipeline

### 4. View Claims
- Click "Claims" in navbar
- See all processed claims
- Click "View" to see detailed breakdown

---

## 🐛 TROUBLESHOOTING

### "MongoDB connection error"
```cmd
cd database
docker-compose down
docker-compose up -d
```

### "Port already in use"
Find and close the application using that port, or change the port in .env files.

### "Module not found"
Make sure you ran `npm install` in all three folders:
```cmd
cd backend && npm install
cd ..\mock-apis && npm install
cd ..\frontend && npm install
```

### "Cannot find page"
Make sure all frontend page files were copied to the correct folders:
- `frontend\src\app\login\page.tsx`
- `frontend\src\app\signup\page.tsx`
- `frontend\src\app\dashboard\page.tsx`
- etc.

---

## 📁 VERIFY FILE STRUCTURE

Your final structure should look like this:

```
C:\InsurNova\
├── backend\
│   ├── models\
│   ├── routes\
│   ├── services\
│   ├── middleware\
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend\
│   ├── src\
│   │   ├── app\
│   │   │   ├── login\page.tsx
│   │   │   ├── signup\page.tsx
│   │   │   ├── dashboard\page.tsx
│   │   │   ├── policy\page.tsx
│   │   │   ├── claims\page.tsx
│   │   │   ├── simulator\page.tsx
│   │   │   └── admin\page.tsx
│   │   ├── lib\
│   │   └── components\
│   └── package.json
├── mock-apis\
│   ├── server.js
│   └── package.json
└── database\
    └── docker-compose.yml
```

---

## 🎉 SUCCESS!

Once all services are running, you have a fully functional AI-powered insurance platform!

**Access it at:** http://localhost:3000

Happy coding! 🚀
