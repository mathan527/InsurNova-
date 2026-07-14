@echo off
echo =====================================
echo   InsurNova - Complete Setup Script
echo =====================================
echo.

echo [1/7] Creating project structure...
mkdir backend\models 2>nul
mkdir backend\routes 2>nul
mkdir backend\services 2>nul
mkdir backend\middleware 2>nul
mkdir backend\config 2>nul
mkdir "mock-apis" 2>nul
mkdir database 2>nul
mkdir frontend\src\app 2>nul
mkdir frontend\src\components 2>nul
mkdir frontend\src\lib 2>nul
mkdir frontend\src\styles 2>nul

echo [2/7] Moving package.json files...
move package-backend.json backend\package.json >nul 2>&1
move package-mock.json mock-apis\package.json >nul 2>&1
move package-frontend.json frontend\package.json >nul 2>&1

echo [3/7] Setting up backend files...
move server-backend.js backend\server.js >nul 2>&1
move model-user.js backend\models\User.js >nul 2>&1
move model-policy.js backend\models\Policy.js >nul 2>&1
move model-claim.js backend\models\Claim.js >nul 2>&1
move model-event.js backend\models\Event.js >nul 2>&1
move service-risk.js backend\services\riskService.js >nul 2>&1
move service-exclusion.js backend\services\exclusionService.js >nul 2>&1
move service-fraud.js backend\services\fraudService.js >nul 2>&1
move service-claim.js backend\services\claimService.js >nul 2>&1
move service-pricing.js backend\services\pricingService.js >nul 2>&1
move middleware-auth.js backend\middleware\auth.js >nul 2>&1
move route-auth.js backend\routes\auth.js >nul 2>&1
move route-policy.js backend\routes\policy.js >nul 2>&1
move route-claims.js backend\routes\claims.js >nul 2>&1
move route-events.js backend\routes\events.js >nul 2>&1
move route-status.js backend\routes\status.js >nul 2>&1
move route-admin.js backend\routes\admin.js >nul 2>&1

echo [4/7] Setting up mock APIs...
move server-mock.js mock-apis\server.js >nul 2>&1

echo [5/7] Setting up environment files...
copy env-backend.txt backend\.env >nul 2>&1
copy env-frontend.txt frontend\.env.local >nul 2>&1
move docker-compose.yml database\docker-compose.yml >nul 2>&1

echo [6/7] Cleaning up...
del env-backend.txt >nul 2>&1
del env-frontend.txt >nul 2>&1

echo [7/7] Project structure ready!
echo.
echo =====================================
echo   Next Steps:
echo =====================================
echo.
echo 1. Install Backend Dependencies:
echo    cd backend
echo    npm install
echo.
echo 2. Install Mock API Dependencies:
echo    cd mock-apis
echo    npm install
echo.
echo 3. Install Frontend Dependencies:
echo    cd frontend
echo    npm install
echo.
echo 4. Start MongoDB:
echo    cd database
echo    docker-compose up -d
echo.
echo 5. Run the application (3 terminals):
echo    Terminal 1: cd backend ^&^& npm run dev
echo    Terminal 2: cd mock-apis ^&^& npm run dev
echo    Terminal 3: cd frontend ^&^& npm run dev
echo.
echo =====================================
echo   Access Points:
echo =====================================
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:5000
echo   Mock APIs: http://localhost:5001
echo =====================================
echo.
pause
