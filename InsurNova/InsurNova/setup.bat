@echo off
echo Creating InsurNova project structure...

mkdir frontend 2>nul
mkdir backend 2>nul
mkdir "mock-apis" 2>nul
mkdir database 2>nul

mkdir backend\models 2>nul
mkdir backend\routes 2>nul
mkdir backend\services 2>nul
mkdir backend\middleware 2>nul
mkdir backend\config 2>nul

mkdir frontend\src 2>nul
mkdir frontend\src\app 2>nul
mkdir frontend\src\components 2>nul
mkdir frontend\src\lib 2>nul
mkdir frontend\src\styles 2>nul

echo.
echo ✓ Project structure created!
echo.
echo Next steps:
echo 1. cd backend ^&^& npm install
echo 2. cd mock-apis ^&^& npm install
echo 3. cd frontend ^&^& npm install
echo 4. cd database ^&^& docker-compose up -d
echo.

dir /AD /B
