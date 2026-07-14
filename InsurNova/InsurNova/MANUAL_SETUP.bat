@echo off
echo ====================================
echo   InsurNova - Manual Setup Guide
echo ====================================
echo.
echo PowerShell Core is not installed on this system.
echo Please follow these manual steps:
echo.
echo STEP 1: Create Folders
echo -----------------------
echo Run these commands one by one:
echo.
echo mkdir backend\models
echo mkdir backend\routes
echo mkdir backend\services
echo mkdir backend\middleware
echo mkdir mock-apis
echo mkdir frontend\src\app\login
echo mkdir frontend\src\app\signup
echo mkdir frontend\src\app\dashboard
echo mkdir frontend\src\app\policy
echo mkdir frontend\src\app\claims
echo mkdir frontend\src\app\simulator
echo mkdir frontend\src\app\admin
echo mkdir frontend\src\lib
echo mkdir frontend\src\components
echo mkdir database
echo.
echo STEP 2: Move Backend Files
echo -----------------------
echo copy server-backend.js backend\server.js
echo copy package-backend.json backend\package.json
echo copy env-backend.txt backend\.env
echo copy model-user.js backend\models\User.js
echo copy model-policy.js backend\models\Policy.js
echo copy model-claim.js backend\models\Claim.js
echo copy model-event.js backend\models\Event.js
echo copy service-risk.js backend\services\riskService.js
echo copy service-exclusion.js backend\services\exclusionService.js
echo copy service-fraud.js backend\services\fraudService.js
echo copy service-claim.js backend\services\claimService.js
echo copy service-pricing.js backend\services\pricingService.js
echo copy route-auth.js backend\routes\auth.js
echo copy route-policy.js backend\routes\policy.js
echo copy route-claims.js backend\routes\claims.js
echo copy route-events.js backend\routes\events.js
echo copy route-status.js backend\routes\status.js
echo copy route-admin.js backend\routes\admin.js
echo copy middleware-auth.js backend\middleware\auth.js
echo.
echo STEP 3: Move Frontend Files
echo -----------------------
echo copy package-frontend.json frontend\package.json
echo copy nextconfig.js frontend\next.config.js
echo copy tsconfig.json frontend\tsconfig.json
echo copy tailwind.config.js frontend\tailwind.config.js
echo copy postcss.config.js frontend\postcss.config.js
echo copy env-frontend.txt frontend\.env.local
echo copy layout.tsx frontend\src\app\layout.tsx
echo copy page.tsx frontend\src\app\page.tsx
echo copy globals.css frontend\src\app\globals.css
echo copy page-login.tsx frontend\src\app\login\page.tsx
echo copy page-signup.tsx frontend\src\app\signup\page.tsx
echo copy page-dashboard.tsx frontend\src\app\dashboard\page.tsx
echo copy page-policy.tsx frontend\src\app\policy\page.tsx
echo copy page-claims.tsx frontend\src\app\claims\page.tsx
echo copy page-simulator.tsx frontend\src\app\simulator\page.tsx
echo copy page-admin.tsx frontend\src\app\admin\page.tsx
echo copy api.ts frontend\src\lib\api.ts
echo copy AuthContext.tsx frontend\src\lib\AuthContext.tsx
echo copy Navbar.tsx frontend\src\components\Navbar.tsx
echo.
echo STEP 4: Move Other Files
echo -----------------------
echo copy server-mock.js mock-apis\server.js
echo copy package-mock.json mock-apis\package.json
echo copy docker-compose.yml database\docker-compose.yml
echo.
echo STEP 5: Install Dependencies
echo -----------------------
echo cd backend
echo npm install
echo cd ..\mock-apis
echo npm install
echo cd ..\frontend
echo npm install
echo.
echo STEP 6: Start Services
echo -----------------------
echo Terminal 1: cd database ^&^& docker-compose up -d
echo Terminal 2: cd backend ^&^& npm run dev
echo Terminal 3: cd mock-apis ^&^& npm run dev
echo Terminal 4: cd frontend ^&^& npm run dev
echo.
echo ====================================
pause
