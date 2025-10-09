# Debug: White Screen Issue

## What To Check

### 1. Open Browser DevTools
Press **F12** in your browser and check:

#### Console Tab
Look for any **RED errors**. Common ones:
- `Cannot read property of undefined`
- `Failed to fetch`
- `Unexpected token`
- Module errors

#### Network Tab
- Are API requests being made?
- Are they failing (red status)?
- Check the request to `/api/predict/SPY`

### 2. Quick Test

Replace App.js temporarily to test if React is working:

**Option A - Use test component:**
```bash
# In frontend/src/index.js, change:
import App from './App';
# to:
import App from './App.test';
```

**Option B - Simplify App.js:**

Add this at the very top of App.js (line 9):
```js
// Debug: Add this right after imports
console.log('App.js loaded!');
```

And wrap the return in error boundary:
```js
try {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      // ... rest of JSX
    </div>
  );
} catch (error) {
  console.error('Render error:', error);
  return <div>Error: {error.message}</div>;
}
```

### 3. Common Causes

#### A. CSS/Tailwind not loading
**Symptom:** Blank white screen, no errors
**Check:** Is `index.css` being imported in `index.js`?
```js
import './index.css';  // This line should be in index.js
```

#### B. API errors on mount
**Symptom:** White screen, errors in console
**Fix:** Make sure backend is running on port 5000

#### C. Missing dependencies
**Symptom:** Module not found errors
**Fix:**
```bash
npm install axios recharts lucide-react
```

#### D. React 18 StrictMode issues
**Symptom:** White screen in development
**Fix:** Comment out StrictMode in index.js:
```js
ReactDOM.render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>,
  document.getElementById('root')
);
```

### 4. Step-by-Step Debug

1. **Check console** (F12 → Console)
   - Copy any error messages

2. **Check if div#root exists**
   - F12 → Elements tab
   - Look for `<div id="root"></div>`
   - Is it empty or has content?

3. **Check if scripts loaded**
   - F12 → Network tab
   - Look for `bundle.js` or `main.chunk.js`
   - Status should be 200

4. **Check CSS loaded**
   - F12 → Network tab
   - Look for CSS files
   - Check if Tailwind classes are applied

### 5. Nuclear Debug Option

Create `frontend/src/SimpleApp.js`:
```js
import React from 'react';

function SimpleApp() {
  return (
    <div style={{
      padding: '40px',
      fontFamily: 'Arial',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>🚀 App is Working!</h1>
      <p>If you see this, React is rendering correctly.</p>

      <div style={{
        marginTop: '20px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px'
      }}>
        <h2>Checklist:</h2>
        <ul>
          <li>✅ React is rendering</li>
          <li>✅ JavaScript is executing</li>
          <li>✅ Styles are applied</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <a
          href="http://localhost:5000/api/health"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'blue', textDecoration: 'underline' }}
        >
          Test Backend API
        </a>
      </div>
    </div>
  );
}

export default SimpleApp;
```

Then in `index.js`:
```js
import SimpleApp from './SimpleApp';
// ...
ReactDOM.render(<SimpleApp />, document.getElementById('root'));
```

If this works → Issue is in main App.js
If this doesn't work → Issue is with React/build setup

### 6. What To Tell Me

When you report back, include:

1. **Browser console errors** (copy/paste any red text)
2. **Network tab** - any failed requests?
3. **Elements tab** - is `<div id="root">` empty or full?
4. **Did SimpleApp work?** - Yes/No

This will help me fix it quickly!
