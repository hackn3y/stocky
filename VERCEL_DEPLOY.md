# Quick Vercel Deployment Guide

## Frontend Deployment to Vercel (5 minutes)

### Prerequisites
- Vercel account (https://vercel.com)
- Railway backend URL (from RAILWAY_DEPLOY.md)
- GitHub repository pushed

### Step-by-Step

1. **Go to Vercel**
   - Visit https://vercel.com
   - Sign in with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Create React App (auto-detected)
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

4. **Add Environment Variable**
   - Click "Environment Variables"
   - Add:
     - Name: `REACT_APP_API_URL`
     - Value: `https://your-backend.up.railway.app/api`
     - (Replace with your Railway URL)
   - Environment: Production ✓

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Vercel will show you the URL

6. **Get Your URL**
   - Copy your URL: `https://_____.vercel.app`
   - Click "Visit" to open the app

### Files Vercel Uses

Vercel automatically detects and uses:

- ✅ `frontend/package.json` → Dependencies and scripts
- ✅ `frontend/vercel.json` → Deployment configuration
- ✅ Environment variables → `REACT_APP_API_URL`

### Environment Variable Setup

**Important:** Create React App requires the `REACT_APP_` prefix!

In Vercel dashboard:
1. Project → Settings → Environment Variables
2. Add: `REACT_APP_API_URL`
3. Value: `https://your-backend.up.railway.app/api`
4. Select: Production, Preview, Development
5. Save

After adding/changing env vars, redeploy:
- Go to "Deployments"
- Click "..." menu on latest deployment
- Click "Redeploy"

### Testing Your App

1. Visit your Vercel URL
2. Check that you see:
   - ✅ "Stock Market Predictor" header
   - ✅ Search box with "SPY"
   - ✅ Prediction loads automatically
   - ✅ Chart displays

3. Test in browser console (F12):
   - No CORS errors
   - API calls succeed: `https://your-backend.railway.app/api/...`

### Common Issues

**Blank white screen**
- Check browser console (F12) for errors
- Verify environment variable is set
- Try hard refresh: Ctrl+Shift+R

**"Failed to fetch" or Network Error**
- Check `REACT_APP_API_URL` in Vercel settings
- Verify Railway backend is running
- Test backend directly: `https://your-backend.railway.app/api/health`
- Check browser console → Network tab

**Environment variable not working**
- Must have `REACT_APP_` prefix
- Must redeploy after adding/changing env vars
- Check spelling and value (no trailing slashes)

**CORS error**
- Backend must allow frontend domain
- Check Railway backend logs
- Update `backend/app.py` if needed:
  ```python
  CORS(app, origins=['https://your-app.vercel.app'])
  ```

### Checking Environment Variables

To verify env vars are loaded:

1. Add temporary console log in `App.js`:
   ```javascript
   console.log('API URL:', process.env.REACT_APP_API_URL);
   ```

2. Redeploy and check browser console

3. Remove the log after verification

### Auto-Deploy

Vercel auto-deploys when you push to GitHub:
```bash
git add .
git commit -m "Update frontend"
git push
```

Vercel detects changes and redeploys automatically!

### Custom Domain (Optional)

To add a custom domain:
1. Vercel → Project → Settings → Domains
2. Add your domain (e.g., `stockpredict.com`)
3. Follow DNS configuration steps

---

## Final Checklist

After deployment, verify:

- ✅ Frontend loads at Vercel URL
- ✅ Backend responds at `/api/health`
- ✅ Predictions work for SPY
- ✅ Historical chart displays
- ✅ No CORS errors in console
- ✅ No "Failed to fetch" errors

### Your URLs

Save these for future reference:

```
Backend:  https://__________.up.railway.app
Frontend: https://__________.vercel.app
```

---

**✅ Your app is now live! 🎉**

Share the Vercel URL with anyone to try your stock predictor!

### What You've Built

You now have a fully deployed machine learning web application:

- 🤖 **ML Model**: Random Forest (51.88% accuracy)
- 🔮 **Predictions**: Next-day stock movement (UP/DOWN)
- 📊 **Charts**: 3-month historical price data
- 🌐 **Backend**: Flask REST API on Railway
- ⚛️ **Frontend**: React app on Vercel
- 🚀 **Auto-Deploy**: Push to GitHub → Auto-updates

**Amazing work!** 🎊
