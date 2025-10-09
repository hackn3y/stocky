# Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## Pre-Deployment Verification

### Backend Files
- ✅ `backend/app.py` - Uses `PORT` environment variable
- ✅ `backend/requirements.txt` - Has gunicorn and all dependencies
- ✅ `backend/Procfile` - Contains `web: gunicorn app:app`
- ✅ `backend/runtime.txt` - Specifies `python-3.11.0`
- ✅ `backend/models/spy_model.pkl` - Trained model exists
- ✅ `backend/.gitignore` - Created to exclude venv, __pycache__

### Frontend Files
- ✅ `frontend/src/App.js` - Uses `process.env.REACT_APP_API_URL`
- ✅ `frontend/vercel.json` - Vercel configuration ready
- ✅ `frontend/.env.example` - Template for environment variables
- ✅ `frontend/.env.local` - Local development (localhost:5000)
- ✅ `frontend/.gitignore` - Excludes .env.local, node_modules, build

### Documentation
- ✅ `README.md` - Complete project documentation
- ✅ `DEPLOYMENT.md` - Comprehensive deployment guide
- ✅ `RAILWAY_DEPLOY.md` - Quick Railway guide
- ✅ `VERCEL_DEPLOY.md` - Quick Vercel guide

---

## Deployment Steps

### Phase 1: Git & GitHub (5 minutes)

- [ ] Initialize Git repository
  ```bash
  cd C:\Users\PC\Documents\stocky
  git init
  ```

- [ ] Add all files
  ```bash
  git add .
  ```

- [ ] Create initial commit
  ```bash
  git commit -m "Initial commit - Stock predictor ready for deployment"
  ```

- [ ] Create GitHub repository at https://github.com/new
  - Name: `stock-predictor` (or your choice)
  - Keep private or make public

- [ ] Add GitHub remote and push
  ```bash
  git remote add origin https://github.com/YOUR_USERNAME/stock-predictor.git
  git branch -M main
  git push -u origin main
  ```

### Phase 2: Backend Deployment (Railway) (10 minutes)

- [ ] Sign up/login to Railway (https://railway.app)

- [ ] Create new project
  - Click "New Project"
  - Select "Deploy from GitHub repo"
  - Choose your repository

- [ ] Configure Railway service
  - Settings → Root Directory: `backend`
  - Verify Python buildpack detected

- [ ] Generate domain
  - Settings → Networking
  - Click "Generate Domain"
  - Save URL: `https://________________.up.railway.app`

- [ ] Wait for deployment
  - Check "Deployments" tab
  - Wait for "SUCCESS" status
  - Review logs for any errors

- [ ] Test backend
  ```bash
  curl https://your-app.up.railway.app/api/health
  ```
  Should return: `{"status": "healthy", ...}`

### Phase 3: Frontend Deployment (Vercel) (10 minutes)

- [ ] Sign up/login to Vercel (https://vercel.com)

- [ ] Import project
  - Click "Add New" → "Project"
  - Import your GitHub repository

- [ ] Configure Vercel
  - Framework: Create React App (auto-detected)
  - Root Directory: `frontend`
  - Build Command: `npm run build`
  - Output Directory: `build`

- [ ] Add environment variable
  - Click "Environment Variables"
  - Name: `REACT_APP_API_URL`
  - Value: `https://your-backend.up.railway.app/api`
  - Environment: Production ✓

- [ ] Deploy
  - Click "Deploy"
  - Wait 2-3 minutes

- [ ] Get frontend URL
  - Copy URL: `https://________________.vercel.app`

### Phase 4: Testing (5 minutes)

- [ ] Test frontend loads
  - Visit your Vercel URL
  - Check for gradient background
  - Check header displays

- [ ] Test prediction functionality
  - Search for "SPY"
  - Click "Predict"
  - Verify prediction displays (UP/DOWN)
  - Check confidence percentage

- [ ] Test historical chart
  - Verify 3-month chart loads
  - Check data points display

- [ ] Test different symbols
  - Try: AAPL, MSFT, TSLA
  - Verify each loads correctly

- [ ] Check browser console (F12)
  - No CORS errors
  - No "Failed to fetch" errors
  - API calls succeed

---

## Post-Deployment

### Documentation
- [ ] Update README.md with your URLs
- [ ] Share app with friends/colleagues
- [ ] Add to portfolio/resume

### Optional Enhancements
- [ ] Set up custom domain (Vercel settings)
- [ ] Configure CORS to restrict origins (backend/app.py)
- [ ] Add analytics (Google Analytics, Vercel Analytics)
- [ ] Set up monitoring/alerts
- [ ] Add more features (watchlists, alerts, etc.)

---

## Your Deployment URLs

Fill in after deployment:

**Backend (Railway):**
```
https://_________________.up.railway.app
```

**Frontend (Vercel):**
```
https://_________________.vercel.app
```

**Test URLs:**
- Health: `https://your-backend.railway.app/api/health`
- Prediction: `https://your-backend.railway.app/api/predict/SPY`
- Frontend: `https://your-frontend.vercel.app`

---

## Troubleshooting Quick Links

If something goes wrong:

1. **Backend issues** → See [RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md#troubleshooting)
2. **Frontend issues** → See [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md#troubleshooting)
3. **Complete guide** → See [DEPLOYMENT.md](DEPLOYMENT.md#troubleshooting)

---

## Success Criteria

Your deployment is successful when:

- ✅ Backend `/api/health` returns healthy status
- ✅ Frontend loads with proper styling
- ✅ Predictions work for multiple symbols
- ✅ Historical charts display
- ✅ No console errors
- ✅ Both auto-deploy on Git push

---

**Estimated Total Time: 30 minutes**

Good luck with your deployment! 🚀
