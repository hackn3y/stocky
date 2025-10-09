# Frontend Troubleshooting Guide

## Common Issues and Solutions

### 1. Tailwind CSS PostCSS Error

**Error:**
```
Error: It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin...
```

**Solution:**
The Tailwind CSS PostCSS plugin has been updated. Make sure you have the correct configuration:

```bash
# Install the new PostCSS plugin
npm install -D @tailwindcss/postcss

# Verify postcss.config.js has:
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

### 2. Module Not Found Errors

**Error:**
```
Module not found: Can't resolve 'axios'
```

**Solution:**
```bash
npm install axios recharts lucide-react
```

### 3. Compilation Errors

**Error:**
```
Failed to compile
```

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### 4. Backend Connection Issues

**Error:**
```
Network Error
```

**Solution:**
1. Make sure Flask backend is running on port 5000
2. Check `http://localhost:5000/api/health` in browser
3. Verify CORS is enabled in backend

### 5. Blank Page or White Screen

**Solution:**
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify API URL in `src/App.js` is correct: `http://localhost:5000/api`

### 6. npm start Fails

**Error:**
```
Error: EADDRINUSE: address already in use
```

**Solution:**
Port 3000 is already in use. Either:
- Stop the other process using port 3000
- Or change port: `PORT=3001 npm start`

### 7. Chart Not Displaying

**Solution:**
1. Check browser console for errors
2. Verify historical data API is working
3. Make sure recharts is installed: `npm list recharts`

### 8. Slow Loading

**Solution:**
- Historical data can take 2-3 seconds to load
- Check your internet connection (yfinance needs it)
- Backend logs will show API calls

### 9. Predictions Always Fail

**Solution:**
1. Check backend model exists: `backend/models/spy_model.pkl`
2. Train model if missing: `cd backend && python train_model.py`
3. Check backend console for errors

### 10. Styling Issues / No Tailwind Styles

**Solution:**
1. Verify `@tailwind` directives in `src/index.css`:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

2. Check `tailwind.config.js` content paths:
   ```js
   content: ["./src/**/*.{js,jsx,ts,tsx}"]
   ```

3. Restart dev server: `npm start`

## Debug Checklist

Before asking for help, check:

- [ ] Backend is running (`python app.py`)
- [ ] Backend is accessible (`curl http://localhost:5000/api/health`)
- [ ] Node modules installed (`npm install`)
- [ ] Correct Node version (14+): `node --version`
- [ ] Browser console shows errors? (F12 → Console tab)
- [ ] Network tab shows API calls? (F12 → Network tab)

## Reset Everything

If nothing works, nuclear option:

```bash
# Backend
cd backend
rm -rf __pycache__ *.pyc
rm -rf models/*
python train_model.py

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

## Getting Help

If issues persist:
1. Check backend logs (Terminal 1)
2. Check browser console (F12)
3. Check network requests (F12 → Network)
4. Verify all dependencies are installed

## Quick Fix Script

Create `fix.sh`:
```bash
#!/bin/bash
cd frontend
npm install -D @tailwindcss/postcss
npm install axios recharts lucide-react
npm start
```

Run: `bash fix.sh`
