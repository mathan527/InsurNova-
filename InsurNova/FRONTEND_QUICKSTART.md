# 🚀 Frontend Quick Start

## Running the Frontend

```bash
cd frontend
npm run dev
```

The app will be available at **http://localhost:5173**

## Login Credentials (Demo)

Since backend authentication isn't fully integrated yet, you can:

1. Go to `/signup` to create a mock account
2. Use any email/password (stored in localStorage for demo)
3. Access all protected pages

## Pages Available

- **Login**: http://localhost:5173/login
- **Signup**: http://localhost:5173/signup  
- **Dashboard**: http://localhost:5173/dashboard (default)
- **Claims**: http://localhost:5173/claims
- **Policies**: http://localhost:5173/policies
- **Simulator**: http://localhost:5173/simulator
- **Analytics**: http://localhost:5173/analytics
- **Profile**: http://localhost:5173/profile
- **Settings**: http://localhost:5173/settings

## Production Build

```bash
npm run build
```

Output will be in `dist/` folder ready for deployment.

## Next Steps

To fully integrate with the backend, you need to:

1. Add authentication endpoints to the backend:
   - `POST /api/auth/login`
   - `POST /api/auth/signup`

2. Add data endpoints:
   - `GET /api/claims` - List all claims
   - `GET /api/policies` - List all policies
   - `GET /api/user/profile` - Get user profile
   - `GET /api/analytics/dashboard` - Get dashboard stats

3. Update backend to serve the frontend build:
   ```javascript
   app.use(express.static(path.join(__dirname, '../../frontend/dist')));
   ```

## Current Status

✅ All pages built and styled
✅ Routing configured  
✅ Mock data for demonstration
✅ Responsive design
⏳ Backend API integration pending
⏳ Real authentication needed
