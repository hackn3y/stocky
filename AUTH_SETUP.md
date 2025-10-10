# Server-Side Authentication Setup Guide

This guide explains how to implement server-side user authentication for your Stock Predictor app.

## Current Setup (Client-Side Only)

- **Location**: `frontend/src/AuthContext.js`
- **Storage**: Browser localStorage only
- **Issue**: Data is not saved on server, lost if user switches devices

## New Setup (Server-Side)

### Backend Changes

1. **New File**: `backend/auth.py`
   - Contains authentication endpoints
   - Uses JWT (JSON Web Tokens) for session management
   - Password hashing with Werkzeug
   - In-memory user storage (upgrade to database later)

2. **Updated**: `backend/app.py`
   - Registered auth blueprint at `/api/auth/*`
   - Added PyJWT and Werkzeug dependencies

3. **Updated**: `backend/requirements.txt`
   - Added `PyJWT>=2.8.0` for JWT token management
   - Added `Werkzeug>=2.3.0` for password hashing

### Available Auth Endpoints

```
POST /api/auth/register
  Body: { "email": "user@example.com", "username": "john", "password": "secret123" }
  Returns: { "success": true, "token": "jwt_token...", "user": {...} }

POST /api/auth/login
  Body: { "email": "user@example.com", "password": "secret123" }
  Returns: { "success": true, "token": "jwt_token...", "user": {...} }

GET /api/auth/me
  Headers: { "Authorization": "Bearer jwt_token..." }
  Returns: { "success": true, "user": {...} }

PUT /api/auth/update
  Headers: { "Authorization": "Bearer jwt_token..." }
  Body: { "watchlist": [...], "portfolio": [...] }
  Returns: { "success": true, "user": {...} }

GET /api/auth/users
  Returns: { "success": true, "users": [{public user data...}] }
```

## How to Use

### Option 1: Keep Current Client-Side Auth (No Changes)

Your current setup works fine for a demo app. Users can login and their data persists in their browser.

**Pros**:
- No backend changes needed
- No database setup required
- Works immediately

**Cons**:
- Data lost if user clears browser cache
- No cross-device sync
- Not production-ready

### Option 2: Switch to Server-Side Auth

#### Step 1: Deploy Backend with Auth

```bash
# Install dependencies
cd backend
pip install PyJWT==2.8.0 Werkzeug==2.3.0

# Test locally
python app.py
```

Test the endpoints:
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"tester","password":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123"}'
```

#### Step 2: Update Frontend AuthContext

Modify `frontend/src/AuthContext.js` to call the new endpoints:

```javascript
const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });

    if (response.data.success) {
      setUser(response.data.user);
      localStorage.setItem('stocky_token', response.data.token);
      localStorage.setItem('stocky_current_user', JSON.stringify(response.data.user));
      return { success: true, user: response.data.user };
    }
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Login failed' };
  }
};
```

#### Step 3: Deploy to Railway

```bash
git add .
git commit -m "Add server-side authentication"
git push
```

Railway will automatically redeploy with the new auth endpoints.

## Upgrading to Production Database

The current setup uses **in-memory storage** (data lost on restart). For production, add a database:

### Option A: PostgreSQL (Railway)

1. **Add PostgreSQL to Railway**:
   - Go to Railway dashboard
   - Click "New" → "Database" → "Add PostgreSQL"
   - Copy connection string

2. **Install SQLAlchemy**:
```bash
pip install SQLAlchemy psycopg2-binary
```

3. **Create User Model** (`backend/models.py`):
```python
from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    watchlist = Column(JSON, default=list)
    portfolio = Column(JSON, default=list)
    predictions = Column(JSON, default=list)
```

4. **Update auth.py** to use database instead of `users_db` dict

### Option B: SQLite (File-Based)

Already have Peewee installed! Just modify `auth.py` to use Peewee models:

```python
from peewee import *
from playhouse.shortcuts import model_to_dict

db = SqliteDatabase('users.db')

class User(Model):
    email = CharField(unique=True)
    username = CharField()
    password = CharField()
    created_at = DateTimeField(default=datetime.now)
    watchlist = TextField(default='[]')

    class Meta:
        database = db

db.connect()
db.create_tables([User])
```

## Security Considerations

### Current Implementation (Good for Demo)

✅ Passwords are hashed with Werkzeug
✅ JWT tokens expire after 7 days
✅ Passwords never sent in responses
✅ CORS enabled for your frontend

### For Production (Additional Steps)

🔒 **Add Environment Variables**:
```python
SECRET_KEY = os.environ.get('JWT_SECRET_KEY')  # Set in Railway
```

🔒 **HTTPS Only**:
- Railway/Vercel already provide HTTPS

🔒 **Rate Limiting**:
```bash
pip install Flask-Limiter
```

🔒 **Email Verification**:
- Add email verification endpoint
- Send confirmation emails

🔒 **Password Requirements**:
- Minimum 8 characters
- Require special characters
- Add password strength meter in frontend

## Testing the Setup

```bash
# Terminal 1: Start backend
cd backend
python app.py

# Terminal 2: Test auth
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","username":"john","password":"password123"}'
```

Expected response:
```json
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "1",
    "email": "john@example.com",
    "username": "john",
    "createdAt": "2025-10-10T02:00:00",
    "watchlist": [],
    "portfolio": []
  }
}
```

## Summary

- ✅ **Auth backend is ready** - Just needs to be deployed
- ✅ **JWT tokens** - Secure session management
- ✅ **Password hashing** - Werkzeug security
- ⏳ **Database** - Currently in-memory, upgrade to PostgreSQL/SQLite
- ⏳ **Frontend integration** - Update AuthContext.js to use API

**Recommendation**: Deploy the auth backend now, then gradually migrate frontend to use it!
