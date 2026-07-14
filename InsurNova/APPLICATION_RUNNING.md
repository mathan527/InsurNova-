# 🚀 InsurNova Application - RUNNING

## ✅ Application Status

**All services are now running!**

### 🗄️ Infrastructure (Docker)
- ✅ **MongoDB**: Running on port 27017 (Up 4 hours)
- ✅ **Redis**: Running on port 6379 (Up 3 hours)

### 🖥️ Backend Services
- ✅ **Event Processor API**: http://localhost:3000
  - Status: HEALTHY ✓
  - Database: CONNECTED ✓
  - All 10 AI agents initialized
  - Serving frontend static files

### 🎨 Frontend Application
- ✅ **React App**: http://localhost:5174
  - Vite dev server running
  - All 8 pages available
  - Hot module replacement enabled

### ⚠️ ML API (Not Running)
- ❌ **ML Service**: http://localhost:8000
  - Status: NOT STARTED
  - Reason: Python dependencies need Visual C++ build tools
  - Note: Backend can still process events without ML (using fallback logic)

---

## 🌐 Access the Application

### **Open in your browser:**

#### Frontend (Main App)
```
http://localhost:5174
```

#### Backend API
```
http://localhost:3000/health
```

---

## 📱 Available Pages

1. **Login**: http://localhost:5174/login
2. **Signup**: http://localhost:5174/signup
3. **Dashboard**: http://localhost:5174/dashboard (default)
4. **Claims**: http://localhost:5174/claims
5. **Policies**: http://localhost:5174/policies
6. **Simulator**: http://localhost:5174/simulator
7. **Analytics**: http://localhost:5174/analytics
8. **Profile**: http://localhost:5174/profile
9. **Settings**: http://localhost:5174/settings

---

## 🔧 Backend API Endpoints

### Health Check
```bash
curl http://localhost:3000/health
```

### Create Test Event
```bash
curl -X POST http://localhost:3000/create-test-event
```

### Process Event
```bash
curl -X POST http://localhost:3000/process-event \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "EVT-001",
    "userId": "TEST_USER_001",
    "policyId": "TEST_POLICY_001"
  }'
```

### Get Pricing
```bash
curl -X POST http://localhost:3000/get-pricing \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "TEST_USER_001",
    "eventType": "RAIN",
    "coverageAmount": 5000
  }'
```

---

## 🎯 Current Limitations

### Authentication ✅ FIXED
- ✅ Backend now has authentication endpoints
- ✅ Signup creates real users in MongoDB
- ✅ Login validates against database
- ✅ JWT tokens issued (mock implementation)
- 📝 Note: Passwords not hashed yet (use bcrypt in production)

### Data
- Frontend displays sample/mock data in some areas
- Backend has these endpoints working:
  - ✅ `/api/auth/signup` - User registration
  - ✅ `/api/auth/login` - User login
  - ✅ `/process-event` - Process insurance events
  - ✅ `/create-test-event` - Create test data
  - ✅ `/get-pricing` - Calculate premiums
- Still need additional endpoints for:
  - `/api/claims` (list all claims)
  - `/api/policies` (list all policies)
  - `/api/user/profile` (get/update profile)
  - `/api/analytics/dashboard` (dashboard stats)

### ML Integration
- ML API not running (requires C++ build tools)
- Agents use fallback logic without ML predictions
- Risk assessment, fraud detection work with basic rules

---

## 🛠️ Managing the Application

### Stop Services
```powershell
# Stop all Node processes (backend + frontend)
Get-Process node | Stop-Process -Force

# Stop Docker containers
docker stop insurnova-mongodb insurnova-redis
```

### Restart Services
```powershell
# Start backend
cd C:\Users\chars\OneDrive\Desktop\InsurNova
npm start

# Start frontend (in new terminal)
cd C:\Users\chars\OneDrive\Desktop\InsurNova\frontend
npm run dev
```

### View Logs
```powershell
# Backend logs are in console or logs/ folder
# Frontend logs are in Vite dev server console
```

---

## 📊 System Resources

**Current Usage:**
- Node.js processes: ~800 MB total
- MongoDB: Running in Docker
- Redis: Running in Docker
- Frontend dev server: Hot reload enabled

---

## 🚀 Next Steps

### To fully integrate frontend with backend:

1. **Add Authentication Endpoints**
   ```javascript
   // In services/event-processor/index.js
   app.post('/api/auth/login', async (req, res) => { ... });
   app.post('/api/auth/signup', async (req, res) => { ... });
   ```

2. **Add Data Endpoints**
   - GET /api/claims
   - GET /api/policies  
   - GET /api/user/profile
   - GET /api/analytics/dashboard

3. **Fix ML API** (Optional)
   - Install Visual Studio Build Tools
   - Or use prebuilt wheels
   - Or deploy with Docker

4. **Deploy Frontend Build**
   ```bash
   cd frontend
   npm run build
   # Serve dist/ folder from backend
   ```

---

## ✨ What You Can Do Now

✅ **Browse the frontend** - All pages are functional with mock data
✅ **Test backend API** - Use curl or Postman to test endpoints
✅ **Create test events** - Process insurance claims
✅ **View agent workflow** - See how orchestrator coordinates agents
✅ **Explore the UI** - Professional, responsive design

---

**Application is LIVE and ready for development! 🎉**

Access the app at: **http://localhost:5174**
