# 📋 INSURNOVA - COMPLETE FILE INDEX

## Current Location: C:\InsurNova\

All files below are in the ROOT directory and need to be organized by running **INSTALL.bat**

---

## 📚 DOCUMENTATION FILES (Keep in Root)
1. ✅ README.md - Project overview and features
2. ✅ SETUP.md - Installation instructions
3. ✅ PROJECT_STATUS.md - Detailed build status
4. ✅ FILE_ORGANIZATION.md - File organization guide
5. ✅ DEPLOYMENT_GUIDE.md - Complete deployment steps
6. ✅ FINAL_SUMMARY.md - Project summary
7. ✅ THIS FILE - Complete file index
8. ✅ .gitignore - Git ignore rules

---

## 🔧 SETUP SCRIPTS (Keep in Root)
9. ✅ INSTALL.bat - **RUN THIS FIRST!** Organizes all files
10. ✅ setup.bat - Alternative setup script

---

## 🗄️ DATABASE FILES (Move to /database/)
11. ✅ docker-compose.yml → database/docker-compose.yml

---

## 🌐 MOCK API FILES (Move to /mock-apis/)
12. ✅ server-mock.js → mock-apis/server.js
13. ✅ package-mock.json → mock-apis/package.json

---

## 🔐 BACKEND FILES

### Backend Root (Move to /backend/)
14. ✅ server-backend.js → backend/server.js
15. ✅ package-backend.json → backend/package.json
16. ✅ env-backend.txt → backend/.env

### Backend Models (Move to /backend/models/)
17. ✅ model-user.js → backend/models/User.js
18. ✅ model-policy.js → backend/models/Policy.js
19. ✅ model-claim.js → backend/models/Claim.js
20. ✅ model-event.js → backend/models/Event.js

### Backend Services (Move to /backend/services/)
21. ✅ service-risk.js → backend/services/riskService.js
22. ✅ service-exclusion.js → backend/services/exclusionService.js
23. ✅ service-fraud.js → backend/services/fraudService.js
24. ✅ service-claim.js → backend/services/claimService.js
25. ✅ service-pricing.js → backend/services/pricingService.js

### Backend Routes (Move to /backend/routes/)
26. ✅ route-auth.js → backend/routes/auth.js
27. ✅ route-policy.js → backend/routes/policy.js
28. ✅ route-claims.js → backend/routes/claims.js
29. ✅ route-events.js → backend/routes/events.js
30. ✅ route-status.js → backend/routes/status.js
31. ✅ route-admin.js → backend/routes/admin.js

### Backend Middleware (Move to /backend/middleware/)
32. ✅ middleware-auth.js → backend/middleware/auth.js

---

## 🎨 FRONTEND FILES

### Frontend Root (Move to /frontend/)
33. ✅ package-frontend.json → frontend/package.json
34. ✅ nextconfig.js → frontend/next.config.js
35. ✅ tsconfig.json → frontend/tsconfig.json
36. ✅ tailwind.config.js → frontend/tailwind.config.js
37. ✅ postcss.config.js → frontend/postcss.config.js
38. ✅ env-frontend.txt → frontend/.env.local

### Frontend App Pages (Move to /frontend/src/app/)
39. ✅ layout.tsx → frontend/src/app/layout.tsx
40. ✅ page.tsx → frontend/src/app/page.tsx
41. ✅ globals.css → frontend/src/app/globals.css
42. ✅ page-login.tsx → frontend/src/app/login/page.tsx
43. ✅ page-signup.tsx → frontend/src/app/signup/page.tsx

### Frontend Lib (Move to /frontend/src/lib/)
44. ✅ api.ts → frontend/src/lib/api.ts
45. ✅ AuthContext.tsx → frontend/src/lib/AuthContext.tsx

### Frontend Components (Move to /frontend/src/components/)
46. ✅ Navbar.tsx → frontend/src/components/Navbar.tsx

---

## 📊 FILE COUNT SUMMARY

### Created and Ready (46 files)
- Documentation: 8 files
- Backend: 19 files (server + models + services + routes + middleware)
- Frontend: 12 files (config + pages + lib + components)
- Mock APIs: 2 files
- Database: 1 file
- Scripts: 2 files
- Config: 2 files

### Needs Creation (5 files)
These need to be manually created after running INSTALL.bat:

47. ⏳ frontend/src/app/dashboard/page.tsx - Main dashboard
48. ⏳ frontend/src/app/policy/page.tsx - Policy management
49. ⏳ frontend/src/app/claims/page.tsx - Claims history
50. ⏳ frontend/src/app/simulator/page.tsx - Event simulator
51. ⏳ frontend/src/app/admin/page.tsx - Admin dashboard

**Template for dashboard/page.tsx is provided in DEPLOYMENT_GUIDE.md**

---

## 🎯 QUICK REFERENCE

### What INSTALL.bat Does:
1. Creates folder structure (backend, frontend, mock-apis, database)
2. Creates subfolders (models, routes, services, middleware, app, lib, components)
3. Moves all files to correct locations
4. Renames files appropriately (e.g., server-backend.js → server.js)
5. Copies environment templates
6. Displays next steps

### File Organization Chart:
```
Before INSTALL.bat:
C:\InsurNova\
└── [46 files in root]

After INSTALL.bat:
C:\InsurNova/
├── backend/              (19 files)
├── frontend/             (12 files + 5 to create)
├── mock-apis/            (2 files)
├── database/             (1 file)
└── [8 documentation files]
```

---

## ✅ VERIFICATION CHECKLIST

After running INSTALL.bat, verify:

### Backend Directory
```
backend/
├── ✅ server.js
├── ✅ package.json
├── ✅ .env
├── models/
│   ├── ✅ User.js
│   ├── ✅ Policy.js
│   ├── ✅ Claim.js
│   └── ✅ Event.js
├── services/
│   ├── ✅ riskService.js
│   ├── ✅ exclusionService.js
│   ├── ✅ fraudService.js
│   ├── ✅ claimService.js
│   └── ✅ pricingService.js
├── routes/
│   ├── ✅ auth.js
│   ├── ✅ policy.js
│   ├── ✅ claims.js
│   ├── ✅ events.js
│   ├── ✅ status.js
│   └── ✅ admin.js
└── middleware/
    └── ✅ auth.js
```

### Frontend Directory
```
frontend/
├── ✅ package.json
├── ✅ next.config.js
├── ✅ tsconfig.json
├── ✅ tailwind.config.js
├── ✅ postcss.config.js
├── ✅ .env.local
└── src/
    ├── app/
    │   ├── ✅ layout.tsx
    │   ├── ✅ page.tsx
    │   ├── ✅ globals.css
    │   ├── login/
    │   │   └── ✅ page.tsx
    │   ├── signup/
    │   │   └── ✅ page.tsx
    │   ├── dashboard/      ⏳ Create this
    │   ├── policy/         ⏳ Create this
    │   ├── claims/         ⏳ Create this
    │   ├── simulator/      ⏳ Create this
    │   └── admin/          ⏳ Create this
    ├── lib/
    │   ├── ✅ api.ts
    │   └── ✅ AuthContext.tsx
    └── components/
        └── ✅ Navbar.tsx
```

### Other Directories
```
mock-apis/
├── ✅ server.js
└── ✅ package.json

database/
└── ✅ docker-compose.yml

Root/
├── ✅ README.md
├── ✅ SETUP.md
├── ✅ PROJECT_STATUS.md
├── ✅ FILE_ORGANIZATION.md
├── ✅ DEPLOYMENT_GUIDE.md
├── ✅ FINAL_SUMMARY.md
├── ✅ FILE_INDEX.md (this file)
├── ✅ .gitignore
├── ✅ INSTALL.bat
└── ✅ setup.bat
```

---

## 🚀 DEPLOYMENT SEQUENCE

### Step 1: Organize Files
```cmd
cd C:\InsurNova
INSTALL.bat
```

### Step 2: Install Dependencies
```cmd
cd backend
npm install

cd ..\mock-apis
npm install

cd ..\frontend
npm install
```

### Step 3: Start Services
```cmd
# Terminal 1 - MongoDB
cd database
docker-compose up -d

# Terminal 2 - Backend
cd backend
npm run dev

# Terminal 3 - Mock APIs
cd mock-apis
npm run dev

# Terminal 4 - Frontend
cd frontend
npm run dev
```

### Step 4: Access Application
- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api
- Mock APIs: http://localhost:5001

---

## 📦 WHAT EACH FILE DOES

### Backend Services (The AI Agents)
- **riskService.js**: Calculates risk scores 0-100 based on event severity
- **exclusionService.js**: Checks war/pandemic/terrorism exclusions
- **fraudService.js**: Runs 4 fraud detection checks
- **claimService.js**: Orchestrates complete automation pipeline
- **pricingService.js**: Calculates dynamic premiums

### Backend Routes (API Endpoints)
- **auth.js**: POST /signup, POST /login, GET /me
- **policy.js**: GET /policy, POST /activate, GET /pricing
- **claims.js**: GET /claims, GET /claims/:id, GET /stats
- **events.js**: POST /events, POST /simulate, GET /events
- **status.js**: GET /status (dashboard metrics)
- **admin.js**: GET /stats, GET /users

### Frontend Pages
- **login/page.tsx**: Login form with rain animation
- **signup/page.tsx**: Signup form with platform selector
- **dashboard/page.tsx**: Main metrics and overview
- **policy/page.tsx**: Coverage management
- **claims/page.tsx**: Claims history
- **simulator/page.tsx**: Event testing tool
- **admin/page.tsx**: Analytics dashboard

---

## 🎨 STYLING REFERENCE

All styles are in `globals.css`:
- Glassmorphism: `.glass`, `.glass-card`, `.glass-dark`
- Animations: `.rain`, `.heat-shimmer`, `.pollution-fog`
- Buttons: `.btn-primary`, `.btn-secondary`
- Inputs: `.input-glass`
- Status: `.status-approved`, `.status-rejected`, `.status-pending`

---

## 🏁 FINAL CHECKLIST

- [x] 46 files created
- [x] Documentation complete (8 files)
- [x] Backend complete (19 files)
- [x] Frontend core complete (12 files)
- [x] Mock APIs complete (2 files)
- [x] Docker config complete (1 file)
- [x] Setup scripts ready (2 files)
- [ ] Run INSTALL.bat
- [ ] Install dependencies
- [ ] Start MongoDB
- [ ] Start backend
- [ ] Start mock APIs
- [ ] Start frontend
- [ ] Create 5 remaining pages
- [ ] Test complete flow

---

**Status**: 🟢 Ready for deployment!  
**Next**: Run `INSTALL.bat` and follow DEPLOYMENT_GUIDE.md

🚀 **InsurNova - AI-Powered Parametric Insurance Platform**
