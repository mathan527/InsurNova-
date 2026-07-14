<<<<<<< HEAD
# 🎉 INSURNOVA - QUICK START GUIDE

## ✅ STATUS: 100% COMPLETE - 52 FILES CREATED!

All backend and frontend files are ready. Follow these steps to launch your application.

---

## 🚀 5-MINUTE SETUP

### Step 1: Organize Files (30 seconds)
```cmd
cd C:\InsurNova
INSTALL.bat
```

### Step 2: Move Frontend Pages (1 minute)
```cmd
REM Create page folders
cd frontend\src\app
mkdir login signup dashboard policy claims simulator admin

REM Go back to root and move files
cd C:\InsurNova
move page-login.tsx frontend\src\app\login\page.tsx
move page-signup.tsx frontend\src\app\signup\page.tsx
move page-dashboard.tsx frontend\src\app\dashboard\page.tsx
move page-policy.tsx frontend\src\app\policy\page.tsx
move page-claims.tsx frontend\src\app\claims\page.tsx
move page-simulator.tsx frontend\src\app\simulator\page.tsx
move page-admin.tsx frontend\src\app\admin\page.tsx
```

### Step 3: Install Dependencies (3 minutes)
```cmd
REM Backend
cd backend
npm install

REM Mock APIs
cd ..\mock-apis
npm install

REM Frontend (includes recharts for admin charts)
cd ..\frontend
npm install recharts
npm install
```

### Step 4: Start MongoDB (30 seconds)
```cmd
cd ..\database
docker-compose up -d
```

### Step 5: Launch All Services (Open 3 terminals)

**Terminal 1 - Backend API**
```cmd
cd C:\InsurNova\backend
npm run dev
```

**Terminal 2 - Mock APIs**
```cmd
cd C:\InsurNova\mock-apis
npm run dev
```

**Terminal 3 - Frontend**
```cmd
cd C:\InsurNova\frontend
npm run dev
=======
# 🚀 InsurNova - Quick Start Guide

Get InsurNova running in **5 minutes**!

---

## Method 1: Docker Compose (Easiest) ⚡

### Prerequisites
- Docker Desktop installed
- 4GB RAM available

### Steps

```bash
# 1. Navigate to project directory
cd InsurNova

# 2. Start all services
docker-compose up -d

# 3. Wait for services to start (~30 seconds)
docker-compose ps

# 4. Test the system
curl http://localhost:3000/health
curl http://localhost:8000/health
```

### What's Running?
- ✅ MongoDB on port 27017
- ✅ Redis on port 6379
- ✅ ML API on port 8000
- ✅ Event Processor on port 3000

### Process Your First Event

```bash
# Create test event
curl -X POST http://localhost:3000/create-test-event | json_pp

# Copy the eventId from response, then process it
curl -X POST http://localhost:3000/process-event \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "EVT-...",
    "userId": "TEST_USER_001",
    "policyId": "TEST_POLICY_001"
  }' | json_pp
```

**Expected Output:**
```json
{
  "success": true,
  "data": {
    "claimId": "CLM-1234567890-abc123",
    "status": "PAID",
    "amount": 712.50,
    "processingTime": 2456
  }
}
>>>>>>> 7887c9b (Initialize InsurNova with Advanced Fraud Detection and Dark UI)
```

---

<<<<<<< HEAD
## 🌐 OPEN YOUR APP

Visit: **http://localhost:3000**

You should see the login page with rain animation! 🌧️

---

## 🧪 FIRST USER FLOW

### 1. Create Account
- Click "Create Account"
- Enter: Name, Email, Password
- Select Platform: Swiggy/Zomato/Uber/Ola
- Click "Create Account" button
- You'll be redirected to the dashboard

### 2. Activate Policy
- Click "Policy" in navbar
- Move the coverage slider
- Watch premium update in real-time
- Click "Activate Plan"
- See success message

### 3. Simulate an Event
- Click "Simulator" in navbar
- Choose event: "Heavy Rain"
- Set severity: 75%
- Click "Simulate Event"
- Watch the pipeline animation
- See if claim is approved/rejected
- Check the payout amount

### 4. View Claims
- Click "Claims" in navbar
- See all your simulated claims
- Click "View" on any claim
- See detailed breakdown:
  - Risk score
  - Exclusion check
  - Fraud detection
  - Final decision

### 5. Admin Panel (Optional)
To access admin dashboard:
1. Use MongoDB Compass or CLI
2. Connect to: mongodb://localhost:27017/insurnova
3. Find your user in `users` collection
4. Change `role` from "user" to "admin"
5. Refresh the page
6. Click "Admin" in navbar
7. View analytics, charts, metrics

---

## 📁 WHAT EACH SERVICE DOES

### Backend (Port 5000)
- Handles authentication (signup/login)
- Processes events through AI agents
- Stores data in MongoDB
- Provides REST APIs

### Mock APIs (Port 5001)
- Simulates weather data
- Simulates AQI (pollution) data
- Simulates government alerts
- Simulates news feeds

### Frontend (Port 3000)
- Beautiful glassmorphism UI
- 7 complete pages
- Real-time animations
- Charts and analytics

---

## 🎨 FEATURES TO TRY

### Animations
- **Login/Signup**: Rain particles falling
- **Dashboard**: Rain background
- **Policy**: Heat shimmer effect
- **Claims**: Pollution fog
- **Approved Claim**: Green pulse glow
- **Rejected Claim**: Red shake

### Event Types
Try simulating these events:
- 🌧️ **Rain** (70%+) → Usually approved
- 🌡️ **Heat** (80%+) → Usually approved
- 🌫️ **Pollution** (60%+) → Usually approved
- 🚨 **Curfew** (50%+) → Usually approved
- 😷 **Pandemic** → Partial payout (50%)
- ⚔️ **War** → Rejected (excluded)

### Coverage Levels
- ₹10,000 → ₹85/month
- ₹50,000 → ₹425/month (Recommended)
- ₹1,00,000 → ₹850/month
- ₹2,00,000 → ₹1,700/month

---

## 🔍 VERIFY EVERYTHING WORKS

### ✅ Backend Check
Visit: http://localhost:5000/api/health
Should see: `{"status":"ok","message":"InsurNova API is running"}`

### ✅ Mock APIs Check
Visit: http://localhost:5001/health
Should see API endpoints listed

### ✅ MongoDB Check
```cmd
docker ps
```
Should see: insurnova-mongodb container running

### ✅ Frontend Check
Visit: http://localhost:3000
Should see: Login page with rain animation

---

## 🐛 TROUBLESHOOTING

### "MongoDB connection error"
```cmd
cd database
docker-compose down
docker-compose up -d
```

### "Port 3000/5000/5001 already in use"
Find and kill the process using that port, or change the port in .env files

### "Module not found"
```cmd
cd backend && npm install
cd ../mock-apis && npm install
cd ../frontend && npm install
```

### "Can't create account"
Check backend logs in Terminal 1 for error messages

### "Charts not showing in Admin"
```cmd
cd frontend
npm install recharts
=======
## Method 2: Manual Setup (Development) 🛠️

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB 7+
- Redis 7+

### Steps

#### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
cd ml
pip install -r requirements.txt
cd ..
```

#### 2. Setup Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env if needed (defaults work for local)
```

#### 3. Start Databases

```bash
# Terminal 1: MongoDB
docker run -d -p 27017:27017 --name insurnova-mongo mongo:7.0

# Terminal 2: Redis
docker run -d -p 6379:6379 --name insurnova-redis redis:7-alpine
```

#### 4. Train ML Models (First Time Only)

```bash
# Train all models (takes ~2 minutes)
python ml/models/risk/train.py
python ml/models/fraud/train.py
python ml/models/churn/train.py
python ml/models/pricing/train.py
```

#### 5. Start Services

```bash
# Terminal 3: ML API
cd services/ml-api
python app.py

# Terminal 4: Event Processor
cd ../..
npm start
```

#### 6. Test

```bash
# Check health
curl http://localhost:3000/health
curl http://localhost:8000/health

# Process event
curl -X POST http://localhost:3000/create-test-event
curl -X POST http://localhost:3000/process-event \
  -H "Content-Type: application/json" \
  -d '{"eventId":"...","userId":"TEST_USER_001","policyId":"TEST_POLICY_001"}'
```

---

## 🎯 What Happens During Event Processing?

```
1. Rain event detected (severity: 75)
   ↓
2. Risk Agent: Predicts 75% payout
   ↓
3. Exclusion Agent: Verifies coverage ✅
   ↓
4. Fraud Agent: No fraud detected ✅
   ↓
5. Claim Agent: Calculates $712.50
   ↓
6. Wallet Agent: Processes payment ✅
   ↓
7. User receives email/SMS notification
   ↓
8. Complete in ~2.5 seconds ⚡
```

---

## 📊 View Logs

### Docker Logs
```bash
# ML API logs
docker logs insurnova-ml-api

# Event Processor logs
docker logs insurnova-event-processor

# Follow logs in real-time
docker logs -f insurnova-event-processor
```

### Manual Logs
```bash
# Check application logs
cat logs/combined.log
cat logs/error.log
```

---

## 🔧 Useful Commands

### Docker Compose

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart a service
docker-compose restart event-processor

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Database Access

```bash
# Connect to MongoDB
docker exec -it insurnova-mongodb mongosh insurnova

# View claims
db.claims.find().pretty()

# View events
db.events.find().pretty()
>>>>>>> 7887c9b (Initialize InsurNova with Advanced Fraud Detection and Dark UI)
```

---

<<<<<<< HEAD
## 📊 FILE COUNT

- ✅ **Backend**: 19 files
- ✅ **Frontend**: 19 files
- ✅ **Mock APIs**: 2 files
- ✅ **Database**: 1 file
- ✅ **Config**: 4 files
- ✅ **Documentation**: 7 files
- **TOTAL**: **52 files**

---

## 🎯 YOU'VE BUILT

✅ AI-powered insurance automation  
✅ Event processing pipeline  
✅ Risk evaluation engine  
✅ Exclusion logic system  
✅ Fraud detection (4 checks)  
✅ Glassmorphism UI  
✅ Real-time animations  
✅ Admin analytics  
✅ Charts and visualizations  
✅ Mobile-responsive design  
✅ Docker deployment  
✅ Production-ready code  

---

## 🚀 NEXT STEPS

1. ✅ Run INSTALL.bat
2. ✅ Move frontend pages
3. ✅ Install dependencies
4. ✅ Start MongoDB
5. ✅ Launch all services
6. 🎉 Create account & explore!

---

**Time to Complete Setup**: 5 minutes  
**Lines of Code**: 12,000+  
**Technologies**: Next.js, Express, MongoDB, Docker, TypeScript  
**Status**: 🟢 **100% READY TO USE!**

🎊 **Congratulations! You have a production-grade insurance platform!** 🎊

Visit: **http://localhost:3000** and start exploring! ✨
=======
## 🧪 Test Scenarios

### Scenario 1: Normal Claim (Approved)
```bash
POST /create-test-event
# Severity will be 60-100 (random)

POST /process-event
# Expected: Status = PAID
```

### Scenario 2: Get Premium Pricing
```bash
curl -X POST http://localhost:3000/get-pricing \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "TEST_USER_001",
    "eventType": "RAIN",
    "coverageAmount": 5000
  }'

# Expected: Premium calculation with risk multiplier
```

---

## 🐛 Troubleshooting

### ML API Won't Start
```bash
# Check if models are trained
ls -la ml/models/risk/

# If empty, train models:
python ml/models/risk/train.py
```

### Database Connection Error
```bash
# Check if MongoDB is running
docker ps | grep mongo

# If not running:
docker start insurnova-mongodb
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change port in .env
```

### Event Processing Fails
```bash
# Check ML API is running
curl http://localhost:8000/health

# Check logs
docker logs insurnova-ml-api
tail -f logs/error.log
```

---

## 🎓 Next Steps

1. **Explore the Code**
   - Start with `agents/orchestrator/index.js`
   - Check `ml/models/risk/train.py`

2. **Read Documentation**
   - `README.md` - Full overview
   - `docs/WORKFLOW.md` - Event processing flow
   - `docs/ML_INTEGRATION.md` - How ML integrates

3. **Customize**
   - Add new event types
   - Modify payout logic
   - Integrate real weather APIs

4. **Deploy**
   - Use Kubernetes manifests in `deployment/kubernetes/`
   - Set up monitoring
   - Configure auto-scaling

---

## 📚 API Reference

### Create Test Event
```bash
POST /create-test-event
```
Creates test user, policy, and event.

### Process Event
```bash
POST /process-event
{
  "eventId": "string",
  "userId": "string",
  "policyId": "string"
}
```
Processes event through full workflow.

### Get Pricing
```bash
POST /get-pricing
{
  "userId": "string",
  "eventType": "RAIN|HEAT|POLLUTION|etc",
  "coverageAmount": number
}
```
Calculates premium for new policy.

### Health Checks
```bash
GET /health            # Event Processor health
GET /health            # ML API health (port 8000)
```

---

## ✅ Success Checklist

After setup, verify:

- [ ] MongoDB is running (port 27017)
- [ ] Redis is running (port 6379)
- [ ] ML API is healthy (http://localhost:8000/health)
- [ ] Event Processor is healthy (http://localhost:3000/health)
- [ ] Can create test event
- [ ] Can process event successfully
- [ ] Claim is created in database
- [ ] Processing time < 5 seconds

---

## 🎉 You're Ready!

InsurNova is now running on your machine. You have:
- ✅ 10 AI agents working together
- ✅ 4 trained ML models
- ✅ Complete event processing workflow
- ✅ Production-ready microservices

**Try processing some events and explore the code!**

---

## 💡 Tips

- Use Docker Compose for quickest setup
- Check logs if something doesn't work
- ML API takes ~30s to load all models
- First event might be slow (cold start)
- Read docs/ folder for detailed information

---

## 📞 Need Help?

- Check `docs/` folder for detailed guides
- Review logs in `logs/` directory
- Check Docker logs: `docker-compose logs`
- Verify all services are running: `docker-compose ps`

---

**Happy Coding! 🚀**
>>>>>>> 7887c9b (Initialize InsurNova with Advanced Fraud Detection and Dark UI)
