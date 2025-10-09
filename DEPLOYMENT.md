# Deployment Guide

This guide will help you deploy the Stock Market Predictor application online using Railway (backend) and Vercel (frontend).

## Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app)
- Vercel account (sign up at https://vercel.com)
- Git installed locally

---

## Part 1: Deploy Backend to Railway

### Step 1: Prepare Your Repository

1. Initialize Git in the project root (if not already done):
   ```bash
   cd C:\Users\PC\Documents\stocky
   git init
   git add .
   git commit -m "Initial commit - Stock predictor app"
   ```

2. Create a GitHub repository:
   - Go to https://github.com/new
   - Name: `stock-predictor` (or your preferred name)
   - Don't initialize with README (we already have files)
   - Click "Create repository"

3. Push to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/stock-predictor.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Railway

1. Go to https://railway.app and sign in

2. Click "New Project" → "Deploy from GitHub repo"

3. Select your `stock-predictor` repository

4. Railway will detect the Python app automatically

5. Configure the deployment:
   - Click on the service that was created
   - Go to "Settings"
   - Set **Root Directory**: `backend`
   - Railway will automatically detect:
     - `runtime.txt` for Python version
     - `requirements.txt` for dependencies
     - `Procfile` for start command

6. **Important: Add the model file**

   The trained model (`models/spy_model.pkl`) needs to be in your repository:
   - Make sure `backend/models/spy_model.pkl` exists
   - It should already be committed to Git
   - If not, run:
     ```bash
     git add backend/models/spy_model.pkl
     git commit -m "Add trained model"
     git push
     ```

7. **Optional: Set environment variables** (if needed)
   - Go to "Variables" tab
   - Add: `FLASK_ENV=production`
   - Railway automatically sets `PORT`

8. Get your backend URL:
   - Go to "Settings" → "Networking"
   - Click "Generate Domain"
   - Copy the URL (e.g., `https://your-app-name.up.railway.app`)
   - **Save this URL - you'll need it for the frontend!**

9. Check deployment status:
   - Go to "Deployments" tab
   - Wait for "SUCCESS" status
   - Check logs for any errors

10. Test the API:
    - Visit: `https://your-app-name.up.railway.app/api/health`
    - You should see: `{"status": "healthy", ...}`

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Configure Environment Variables

1. Create production environment file locally (optional):
   ```bash
   cd frontend
   # Copy the example file
   copy .env.example .env.production.local
   ```

2. Edit `.env.production.local` (or note for later):
   ```
   REACT_APP_API_URL=https://your-app-name.up.railway.app/api
   ```
   Replace with your actual Railway URL from Part 1, Step 8.

### Step 2: Deploy to Vercel

1. Go to https://vercel.com and sign in

2. Click "Add New" → "Project"

3. Import your GitHub repository:
   - Select `stock-predictor`
   - Click "Import"

4. Configure the project:
   - **Framework Preset**: Create React App (should auto-detect)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `build` (default)

5. **Set Environment Variables**:
   - Click "Environment Variables"
   - Add variable:
     - Name: `REACT_APP_API_URL`
     - Value: `https://your-app-name.up.railway.app/api`
     - (Use your Railway backend URL)
   - Environment: Production, Preview, Development (select all)

6. Click "Deploy"

7. Wait for deployment to complete (2-3 minutes)

8. Get your frontend URL:
   - Vercel will show you the URL (e.g., `https://stock-predictor.vercel.app`)
   - Click "Visit" to open the app

---

## Part 3: Configure CORS (Backend)

After deploying, you need to allow the frontend to access the backend.

### Option 1: Update CORS in Railway

1. Go to Railway → Your Backend Service → Variables

2. Add environment variable:
   - Name: `FRONTEND_URL`
   - Value: `https://your-app.vercel.app`

3. Update `backend/app.py`:
   ```python
   from flask_cors import CORS
   import os

   app = Flask(__name__)

   # Configure CORS
   frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
   CORS(app, origins=[frontend_url, 'http://localhost:3000'])
   ```

4. Commit and push:
   ```bash
   git add backend/app.py
   git commit -m "Configure CORS for production"
   git push
   ```

   Railway will auto-redeploy.

### Option 2: Keep Open CORS (Simpler, Less Secure)

The current `CORS(app)` configuration allows all origins. This works but is less secure. For a personal/educational project, this is fine.

---

## Part 4: Test Your Deployed App

1. Visit your Vercel URL: `https://your-app.vercel.app`

2. Test the app:
   - ✅ Page loads with gradient background
   - ✅ Enter symbol "SPY" and click "Predict"
   - ✅ Prediction displays (UP/DOWN)
   - ✅ Chart loads with historical data
   - ✅ Stock info appears

3. Check browser console (F12):
   - No CORS errors
   - API calls succeed

4. Test different symbols:
   - SPY, AAPL, MSFT, TSLA
   - Check that predictions load

---

## Troubleshooting

### Backend Issues

**Error: "Model not found"**
- Solution: Make sure `backend/models/spy_model.pkl` is committed to Git
- Check Railway logs: Click "Deployments" → "View Logs"
- Run: `git add backend/models/spy_model.pkl && git commit -m "Add model" && git push`

**Error: "Application failed to start"**
- Check Railway logs for Python errors
- Verify `Procfile` is correct: `web: gunicorn app:app`
- Verify `runtime.txt` has: `python-3.11.0`
- Check `requirements.txt` has all dependencies

**Error: "Port binding failed"**
- Verify `app.py` uses: `port = int(os.environ.get('PORT', 5000))`
- Check that `host='0.0.0.0'` is set

### Frontend Issues

**Error: "Network Error" or CORS errors**
- Check `REACT_APP_API_URL` environment variable in Vercel
- Verify Railway backend is running (visit `/api/health`)
- Check Railway logs for CORS issues
- Verify backend CORS configuration allows frontend domain

**Error: "Failed to fetch"**
- Open browser console (F12) → Network tab
- Check if API URL is correct
- Verify Railway backend URL is accessible
- Try visiting backend URL directly: `https://your-backend.railway.app/api/health`

**Error: Blank page**
- Check browser console for errors
- Verify Vercel build succeeded
- Check that `vercel.json` is configured correctly
- Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

**Environment variable not working**
- Vercel requires `REACT_APP_` prefix for Create React App
- After changing env vars, redeploy in Vercel
- Check Vercel dashboard → Project → Settings → Environment Variables

---

## Updating Your App

### Update Backend

1. Make changes to backend code
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update backend"
   git push
   ```
3. Railway auto-deploys on push

### Update Frontend

1. Make changes to frontend code
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update frontend"
   git push
   ```
3. Vercel auto-deploys on push

---

## Costs

- **Railway**: Free tier includes 500 hours/month (enough for 1 project)
- **Vercel**: Free tier includes unlimited deployments and bandwidth

Both are free for hobby/personal projects!

---

## Summary Checklist

### Backend (Railway)
- ✅ `backend/requirements.txt` has all dependencies + gunicorn
- ✅ `backend/Procfile` has `web: gunicorn app:app`
- ✅ `backend/runtime.txt` has `python-3.11.0`
- ✅ `backend/app.py` uses `os.environ.get('PORT', 5000)`
- ✅ `backend/models/spy_model.pkl` is committed to Git
- ✅ Railway project created and deployed
- ✅ Backend URL obtained and tested

### Frontend (Vercel)
- ✅ `frontend/.env.example` created for reference
- ✅ `frontend/vercel.json` configured
- ✅ `frontend/src/App.js` uses `process.env.REACT_APP_API_URL`
- ✅ Vercel project created and deployed
- ✅ `REACT_APP_API_URL` environment variable set in Vercel
- ✅ Frontend URL obtained and tested

### Testing
- ✅ Backend health check works: `/api/health`
- ✅ Frontend loads and displays UI
- ✅ Predictions work for SPY
- ✅ Charts display historical data
- ✅ No CORS errors in browser console

---

## Your URLs

After deployment, save these URLs:

- **Backend API**: `https://__________.up.railway.app`
- **Frontend App**: `https://__________.vercel.app`

---

## Next Steps

1. Share your app with friends!
2. Add more features:
   - User watchlists
   - Email alerts
   - More stock metrics
3. Improve the model:
   - Train on more data
   - Add more features
   - Try different algorithms
4. Add authentication (optional)
5. Set up custom domain (optional)

**Congratulations! Your app is now live! 🎉**
