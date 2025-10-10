# Deployment Status & Fix Guide

## Current Status (October 10, 2025)

### ✅ What's Working
- **Local Development**: Both frontend and backend work perfectly on localhost
- **Vercel Frontend**: Deployed at https://stocky-mu.vercel.app/ (loads but gets API errors)
- **Railway Backend**: Deployed at https://stocky-production-16bc.up.railway.app/ (health endpoint works)
- **Git LFS**: Successfully configured for model files (.pkl)
- **Code**: All latest features pushed to GitHub

### ❌ Current Issue
**Railway backend returns 400 error** when frontend tries to fetch predictions.

**Error seen in browser console:**
```
GET https://stocky-production-16bc.up.railway.app/api/predict/SPY 400 (Bad Request)
```

## Root Cause

The Railway deployment is likely using **old code** from before we:
1. Migrated to Git LFS (which rewrote git history)
2. Added enhanced model features
3. Updated dependencies (xgboost, catboost)

Railway needs to redeploy with the latest code.

---

## Solution: Force Railway Redeploy

### Option 1: Via Railway Dashboard (Recommended)

1. Go to https://railway.app/dashboard
2. Select your "stocky" backend project
3. Go to **Deployments** tab
4. Click **Redeploy** on the latest deployment
5. Wait 3-5 minutes for deployment to complete
6. Test: Visit `https://stocky-production-16bc.up.railway.app/api/predict/SPY`
   - Should return JSON with prediction data
   - Not a 400 error

### Option 2: Reconnect GitHub Repository

If Railway isn't auto-deploying:

1. Railway Dashboard → Your Project → Settings
2. **Service** → **Source**
3. Click "Disconnect" then "Connect Repository"
4. Re-select your GitHub repo: `hackn3y/stocky`
5. Ensure **Root Directory** is set to: `backend`
6. Click "Deploy Now"

### Option 3: Trigger via Empty Commit

```bash
cd C:\Users\PC\Documents\stocky
git commit --allow-empty -m "chore: Trigger Railway redeploy"
git push origin main
```

Railway should detect the push and redeploy automatically.

---

## What Railway Needs to Deploy

### Required Files (all present in repo)
- ✅ `backend/app.py` - Main Flask application
- ✅ `backend/predict.py` - Prediction logic
- ✅ `backend/feature_engineering.py` - Technical indicators
- ✅ `backend/enhanced_model.py` - Enhanced model code
- ✅ `backend/requirements.txt` - Python dependencies (updated with xgboost/catboost)
- ✅ `backend/Procfile` - Start command: `web: gunicorn app:app`
- ✅ `backend/runtime.txt` - Python version: 3.11.0
- ✅ `backend/models/*.pkl` - Model files (now in Git LFS)

### Required Environment Variables (Railway auto-sets)
- `PORT` - Railway provides this automatically
- `FLASK_ENV` - Optional, can be set to "production"

---

## Verification Steps

After Railway redeploys, verify these endpoints work:

### 1. Health Check (Should Already Work)
```bash
curl https://stocky-production-16bc.up.railway.app/api/health
```
**Expected:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-10T...",
  "version": "2.1.0"
}
```

### 2. Prediction (Currently Failing - Should Work After Redeploy)
```bash
curl https://stocky-production-16bc.up.railway.app/api/predict/SPY
```
**Expected:**
```json
{
  "success": true,
  "symbol": "SPY",
  "prediction": "UP",
  "confidence": 52.3,
  "current_price": 450.25,
  "probabilities": {
    "up": 52.3,
    "down": 47.7
  },
  "timestamp": "2025-10-10T..."
}
```

### 3. Historical Data
```bash
curl https://stocky-production-16bc.up.railway.app/api/historical/SPY?period=1mo
```
Should return monthly price data.

### 4. Risk Metrics (New Feature)
```bash
curl https://stocky-production-16bc.up.railway.app/api/risk-metrics/SPY
```
Should return Sharpe ratio, volatility, beta, etc.

---

## After Railway is Fixed

Once Railway backend works, your Vercel frontend at https://stocky-mu.vercel.app/ should automatically work because:

1. Environment variable `REACT_APP_API_URL` is already set to Railway backend
2. Frontend code is correct
3. It's just waiting for a working backend

---

## Troubleshooting

### If Railway deployment fails:

**Check Railway Build Logs:**
1. Railway Dashboard → Your Project → Deployments
2. Click on latest deployment
3. View "Build Logs" and "Deploy Logs"
4. Look for error messages

**Common Issues:**

1. **"Failed to install xgboost/catboost"**
   - Railway may need more build time
   - These are large libraries
   - Wait 5-10 minutes for first build

2. **"Model file not found"**
   - Git LFS may not be pulling .pkl files
   - Railway should support LFS automatically
   - Check Deploy Logs for LFS messages

3. **"Import error: enhanced_model"**
   - Make sure `backend/enhanced_model.py` is in repo
   - Check: `git ls-files backend/enhanced_model.py`

4. **"Out of memory during build"**
   - XGBoost/CatBoost are memory-intensive
   - May need to upgrade Railway plan
   - Or remove enhanced model features temporarily

---

## Quick Fix If Railway Won't Work

If Railway keeps failing, you can temporarily disable the enhanced model:

1. Edit `backend/predict.py`:
   - Comment out lines 45-92 (enhanced model logic)
   - This forces it to use only the original model

2. Remove from `backend/requirements.txt`:
   - `xgboost>=2.0.0`
   - `catboost>=1.2.0`

3. Push changes:
   ```bash
   git add backend/
   git commit -m "temp: Disable enhanced model for Railway"
   git push
   ```

This gives you a working deployment while you debug the enhanced model.

---

## Expected Timeline

1. **Push to GitHub**: ✅ Complete (latest push: 09255af)
2. **Railway Auto-Deploy**: 3-5 minutes after push
3. **Build Complete**: 5-10 minutes (xgboost/catboost are large)
4. **Service Live**: Immediately after build
5. **Vercel Frontend Works**: Immediately (already deployed, just waiting for backend)

**Total time**: 10-15 minutes from now

---

## How to Monitor Progress

### Railway Dashboard
- Watch "Deployments" tab
- Status will change: Queued → Building → Deploying → Active
- Green checkmark = success
- Red X = failed (check logs)

### Test Backend Every Minute
```bash
# This should eventually return prediction data, not 400 error
curl https://stocky-production-16bc.up.railway.app/api/predict/SPY
```

### Test Frontend
Once backend works, visit:
- https://stocky-mu.vercel.app/
- Search for "SPY"
- You should see predictions!

---

## Summary

**What happened:**
- Git LFS migration rewrote history
- Railway deployment got out of sync
- Backend needs to redeploy with latest code

**What to do:**
1. Go to Railway Dashboard
2. Click "Redeploy" on latest deployment
3. Wait 10 minutes
4. Test the API endpoints
5. Verify Vercel frontend works

**Expected result:**
- ✅ Railway backend serves predictions correctly
- ✅ Vercel frontend displays stock predictions
- ✅ All features working in production

---

**Last Updated**: October 10, 2025 4:35 AM
**Latest Commit**: 09255af - Added xgboost/catboost dependencies
**Status**: Waiting for Railway redeploy
