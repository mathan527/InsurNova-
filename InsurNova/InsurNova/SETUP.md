# InsurNova Setup Instructions

## Step 1: Run Setup Script

Open Command Prompt in C:\InsurNova and run:

```cmd
setup.bat
```

This will create all necessary directories.

## Step 2: Move Package Files

After running setup.bat, move the package.json files:

```cmd
move package-backend.json backend\package.json
move package-mock.json mock-apis\package.json  
move package-frontend.json frontend\package.json
```

## Step 3: Install Dependencies

### Backend
```cmd
cd backend
npm install
copy .env.example .env
cd ..
```

### Mock APIs
```cmd
cd mock-apis
npm install
cd ..
```

### Frontend
```cmd
cd frontend
npm install
cd ..
```

## Step 4: Start MongoDB

```cmd
cd database
docker-compose up -d
cd ..
```

## Step 5: Run the Application

Open 3 separate Command Prompt windows:

**Window 1 - Backend:**
```cmd
cd backend
npm run dev
```

**Window 2 - Mock APIs:**
```cmd
cd mock-apis
npm run dev
```

**Window 3 - Frontend:**
```cmd
cd frontend
npm run dev
```

## Access Points

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000  
- Mock APIs: http://localhost:5001
- MongoDB: mongodb://localhost:27017/insurnova

## Troubleshooting

If PowerShell Core is needed, install from: https://aka.ms/powershell

---

Continue reading README.md for full project documentation.
