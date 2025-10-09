# Fix Vercel Deployment - Connect Frontend to Backend

## Problem
Your Vercel frontend (https://stocky-mu.vercel.app/) is not working because it doesn't know where your Railway backend API is located.

## Solution
You need to add the `REACT_APP_API_URL` environment variable to Vercel pointing to your Railway backend.

---

## Step 1: Get Your Railway Backend URL

### Option A: Check Railway Dashboard
1. Go to https://railway.app
2. Log in to your account
3. Find your "stocky" backend project
4. Go to Settings → Networking
5. Copy the generated domain (e.g., `https://stocky-production-xxxx.up.railway.app`)

### Option B: Test if Railway is deployed
Try these URLs in your browser (replace with your actual Railway URL):
```
https://your-backend.up.railway.app/api/health
```

If you see JSON like `{"status": "healthy", ...}`, your backend is working!

---

## Step 2: Add Environment Variable to Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your "stocky" project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://your-backend.up.railway.app/api`
   - **Environments**: Check all (Production, Preview, Development)
5. Click **Save**

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI if not installed
npm install -g vercel

# Link to your project
cd C:\Users\PC\Documents\stocky\frontend
vercel link

# Add environment variable
vercel env add REACT_APP_API_URL production
# When prompted, enter: https://your-backend.up.railway.app/api

# Also add for preview and development
vercel env add REACT_APP_API_URL preview
vercel env add REACT_APP_API_URL development
```

---

## Step 3: Trigger Vercel Rebuild

After adding the environment variable, you need to trigger a rebuild:

### Option A: Via Dashboard
1. In Vercel dashboard, go to **Deployments**
2. Click the **•••** menu on the latest deployment
3. Click **Redeploy**
4. Select **Use existing Build Cache** → Click **Redeploy**

### Option B: Push to GitHub
```bash
# Make a small change to trigger rebuild
cd C:\Users\PC\Documents\stocky
echo "# Updated: $(date)" >> frontend/README.md
git add frontend/README.md
git commit -m "chore: Trigger Vercel rebuild with env vars"
git push origin main
```

Vercel will automatically detect the push and rebuild with the new environment variable.

---

## Step 4: Verify It Works

1. Wait for Vercel deployment to complete (1-2 minutes)
2. Visit https://stocky-mu.vercel.app/
3. Try searching for a stock symbol (e.g., "SPY")
4. You should now see predictions!

### Troubleshooting

**Still not working?**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for API errors
4. Check if it's calling the correct backend URL

**Check environment variable was set:**
1. In Vercel dashboard, go to Settings → Environment Variables
2. Verify `REACT_APP_API_URL` is listed
3. Make sure it ends with `/api` (not a trailing slash)

**Backend not responding?**
1. Check Railway dashboard for errors
2. Verify Railway backend is running
3. Test backend URL directly: `https://your-backend.up.railway.app/api/health`

---

## Example Configuration

If your Railway backend URL is:
```
https://stocky-production-a3f2.up.railway.app
```

Then your Vercel environment variable should be:
```
REACT_APP_API_URL=https://stocky-production-a3f2.up.railway.app/api
```

**Note the `/api` at the end!**

---

## What's Happening

1. **Local development**: Uses `.env.local` which points to `http://localhost:5000/api`
2. **Vercel production**: Needs environment variable pointing to Railway backend
3. **The build**: When Vercel builds your React app, it bakes in the `REACT_APP_API_URL` value
4. **After rebuild**: Your frontend will make API calls to Railway instead of localhost

---

## Common Mistakes

❌ **Wrong**: `REACT_APP_API_URL=https://railway.app` (Railway homepage, not your backend)
❌ **Wrong**: `REACT_APP_API_URL=http://localhost:5000/api` (localhost doesn't work in production)
❌ **Wrong**: `REACT_APP_API_URL=https://your-backend.up.railway.app/` (missing `/api`)
✅ **Correct**: `REACT_APP_API_URL=https://your-backend.up.railway.app/api`

---

## Quick Fix Script

If you want to automate this (after getting your Railway URL):

```bash
# Set your Railway backend URL here
BACKEND_URL="https://your-backend.up.railway.app"

# Add to Vercel
vercel env add REACT_APP_API_URL production
# Enter: ${BACKEND_URL}/api

# Trigger rebuild
git commit --allow-empty -m "chore: Trigger Vercel rebuild"
git push origin main
```

---

## Need Help?

1. **Can't find Railway URL?**
   - Check Railway dashboard → Your service → Settings → Networking
   - Or redeploy backend to Railway first

2. **Don't have Railway backend deployed?**
   - Follow RAILWAY_DEPLOY.md to deploy backend first
   - Then come back here

3. **Still having issues?**
   - Check Railway logs for backend errors
   - Check Vercel deployment logs
   - Check browser console for frontend errors

---

**After following these steps, your Vercel deployment should work! 🚀**
