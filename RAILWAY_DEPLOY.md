# Quick Railway Deployment Guide

## Backend Deployment to Railway (5 minutes)

### Prerequisites
- GitHub account
- Railway account (https://railway.app)
- Git initialized in your project

### Step-by-Step

1. **Push to GitHub**
   ```bash
   cd C:\Users\PC\Documents\stocky
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Railway**
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Python app

3. **Configure Root Directory**
   - Click on your service
   - Settings → Root Directory: `backend`
   - Save changes

4. **Generate Domain**
   - Settings → Networking
   - Click "Generate Domain"
   - Copy your URL: `https://_____.up.railway.app`

5. **Verify Deployment**
   - Visit: `https://your-app.up.railway.app/api/health`
   - Should return: `{"status": "healthy", ...}`

### Files Railway Uses

Railway automatically detects and uses these files:

- ✅ `backend/runtime.txt` → Python version (3.11.0)
- ✅ `backend/requirements.txt` → Dependencies to install
- ✅ `backend/Procfile` → Start command (`gunicorn app:app`)
- ✅ `backend/models/spy_model.pkl` → Your trained model

### Environment Variables

Railway automatically sets:
- `PORT` → Your app uses this via `os.environ.get('PORT', 5000)`

Optional variables you can add:
- `FLASK_ENV=production`

### Common Issues

**"Model not found" error**
- Ensure `backend/models/spy_model.pkl` is committed to Git
- Check: `git ls-files backend/models/spy_model.pkl`

**Build fails**
- Check "Deployments" tab → View Logs
- Verify `requirements.txt` is correct
- Ensure `runtime.txt` has valid Python version

**CORS errors**
- Currently allows all origins: `CORS(app)`
- To restrict, update `backend/app.py`:
  ```python
  CORS(app, origins=['https://your-frontend.vercel.app'])
  ```

### Testing Your API

After deployment, test these endpoints:

```bash
# Health check
curl https://your-app.up.railway.app/api/health

# Model info
curl https://your-app.up.railway.app/api/model/info

# Prediction
curl https://your-app.up.railway.app/api/predict/SPY

# Historical data
curl https://your-app.up.railway.app/api/historical/SPY?period=1mo
```

### Auto-Deploy

Railway auto-deploys when you push to GitHub:
```bash
git add .
git commit -m "Update backend"
git push
```

Railway detects changes and redeploys automatically!

---

**✅ That's it! Your backend is live!**

Next: Deploy frontend to Vercel (see VERCEL_DEPLOY.md)
