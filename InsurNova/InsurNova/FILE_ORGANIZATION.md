# InsurNova - Complete File Organization Guide

## Files Created in Root (C:\InsurNova\)

These files need to be moved to their proper locations:

### Configuration Files (Keep in Root)
- ✅ README.md
- ✅ SETUP.md
- ✅ PROJECT_STATUS.md
- ✅ .gitignore
- ✅ INSTALL.bat

### Backend Files (Move to /backend/)
- server-backend.js → backend/server.js
- package-backend.json → backend/package.json
- env-backend.txt → backend/.env

### Backend Models (Move to /backend/models/)
- model-user.js → backend/models/User.js
- model-policy.js → backend/models/Policy.js
- model-claim.js → backend/models/Claim.js
- model-event.js → backend/models/Event.js

### Backend Services (Move to /backend/services/)
- service-risk.js → backend/services/riskService.js
- service-exclusion.js → backend/services/exclusionService.js
- service-fraud.js → backend/services/fraudService.js
- service-claim.js → backend/services/claimService.js
- service-pricing.js → backend/services/pricingService.js

### Backend Routes (Move to /backend/routes/)
- route-auth.js → backend/routes/auth.js
- route-policy.js → backend/routes/policy.js
- route-claims.js → backend/routes/claims.js
- route-events.js → backend/routes/events.js
- route-status.js → backend/routes/status.js
- route-admin.js → backend/routes/admin.js

### Backend Middleware (Move to /backend/middleware/)
- middleware-auth.js → backend/middleware/auth.js

### Mock APIs (Move to /mock-apis/)
- server-mock.js → mock-apis/server.js
- package-mock.json → mock-apis/package.json

### Database (Move to /database/)
- docker-compose.yml → database/docker-compose.yml
(File is already there if you ran setup correctly)

### Frontend Core (Move to /frontend/)
- package-frontend.json → frontend/package.json
- nextconfig.js → frontend/next.config.js
- tsconfig.json → frontend/tsconfig.json
- tailwind.config.js → frontend/tailwind.config.js
- postcss.config.js → frontend/postcss.config.js

### Frontend App (Move to /frontend/src/app/)
- layout.tsx → frontend/src/app/layout.tsx
- page.tsx → frontend/src/app/page.tsx
- globals.css → frontend/src/app/globals.css

### Frontend Lib (Move to /frontend/src/lib/)
- api.ts → frontend/src/lib/api.ts
- AuthContext.tsx → frontend/src/lib/AuthContext.tsx

### Frontend Components (Move to /frontend/src/components/)
- Navbar.tsx → frontend/src/components/Navbar.tsx

---

## Quick Organization Commands

Run these commands in C:\InsurNova\ directory:

```cmd
REM This is what INSTALL.bat does automatically
REM But if you need to do it manually:

REM Create directories
mkdir backend\models
mkdir backend\routes
mkdir backend\services
mkdir backend\middleware
mkdir mock-apis
mkdir frontend\src\app
mkdir frontend\src\lib
mkdir frontend\src\components

REM Move backend files
move server-backend.js backend\server.js
move package-backend.json backend\package.json
copy env-backend.txt backend\.env

REM Move models
move model-*.js backend\models\
ren backend\models\model-user.js User.js
ren backend\models\model-policy.js Policy.js
ren backend\models\model-claim.js Claim.js
ren backend\models\model-event.js Event.js

REM Move services  
move service-*.js backend\services\
ren backend\services\service-risk.js riskService.js
ren backend\services\service-exclusion.js exclusionService.js
ren backend\services\service-fraud.js fraudService.js
ren backend\services\service-claim.js claimService.js
ren backend\services\service-pricing.js pricingService.js

REM Move routes
move route-*.js backend\routes\
ren backend\routes\route-auth.js auth.js
ren backend\routes\route-policy.js policy.js
ren backend\routes\route-claims.js claims.js
ren backend\routes\route-events.js events.js
ren backend\routes\route-status.js status.js
ren backend\routes\route-admin.js admin.js

REM Move middleware
move middleware-auth.js backend\middleware\auth.js

REM Move mock APIs
move server-mock.js mock-apis\server.js
move package-mock.json mock-apis\package.json

REM Move frontend files
move package-frontend.json frontend\package.json
move nextconfig.js frontend\next.config.js
move tsconfig.json frontend\tsconfig.json
move tailwind.config.js frontend\tailwind.config.js
move postcss.config.js frontend\postcss.config.js
move layout.tsx frontend\src\app\layout.tsx
move page.tsx frontend\src\app\page.tsx
move globals.css frontend\src\app\globals.css
move api.ts frontend\src\lib\api.ts
move AuthContext.tsx frontend\src\lib\AuthContext.tsx
move Navbar.tsx frontend\src\components\Navbar.tsx
copy env-frontend.txt frontend\.env.local

echo Done! Files organized.
```

---

## Verification Checklist

After running INSTALL.bat, verify these files exist:

### Backend Structure
```
backend/
├── server.js
├── package.json
├── .env
├── models/
│   ├── User.js
│   ├── Policy.js
│   ├── Claim.js
│   └── Event.js
├── services/
│   ├── riskService.js
│   ├── exclusionService.js
│   ├── fraudService.js
│   ├── claimService.js
│   └── pricingService.js
├── routes/
│   ├── auth.js
│   ├── policy.js
│   ├── claims.js
│   ├── events.js
│   ├── status.js
│   └── admin.js
└── middleware/
    └── auth.js
```

### Frontend Structure
```
frontend/
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── .env.local
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    ├── lib/
    │   ├── api.ts
    │   └── AuthContext.tsx
    └── components/
        └── Navbar.tsx
```

### Other Directories
```
mock-apis/
├── server.js
└── package.json

database/
└── docker-compose.yml
```

---

## Installation Steps

1. **Organize Files**: Run `INSTALL.bat`
2. **Install Dependencies**:
   ```cmd
   cd backend && npm install
   cd ../mock-apis && npm install
   cd ../frontend && npm install
   ```
3. **Start MongoDB**: 
   ```cmd
   cd database
   docker-compose up -d
   ```
4. **Run Services** (3 separate terminals):
   ```cmd
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Mock APIs
   cd mock-apis
   npm run dev
   
   # Terminal 3 - Frontend
   cd frontend
   npm run dev
   ```

---

## What's Working Now

✅ Backend API fully functional
✅ Authentication system
✅ Claim processing pipeline
✅ AI agent services (risk, exclusion, fraud)
✅ Mock external APIs
✅ Frontend core & navigation
✅ Glassmorphism styling
✅ Animations (rain, heat, fog)

## What Needs to be Created

The frontend page components need to be created manually in `/frontend/src/app/`:
- login/page.tsx
- signup/page.tsx
- dashboard/page.tsx
- policy/page.tsx
- claims/page.tsx
- simulator/page.tsx
- admin/page.tsx

Refer to PROJECT_STATUS.md for detailed requirements for each page.

---

**Ready to deploy!** Run INSTALL.bat to get started. 🚀
