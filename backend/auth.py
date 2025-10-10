"""
Authentication endpoints for the Stock Predictor API
Handles user registration, login, and JWT token management
"""
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
import os

auth_bp = Blueprint('auth', __name__)

# Secret key for JWT (in production, use environment variable)
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')

# In-memory user store (replace with database in production)
users_db = {}

def token_required(f):
    """Decorator to protect routes that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({'success': False, 'error': 'Token is missing'}), 401

        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]

            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = users_db.get(data['user_id'])

            if not current_user:
                return jsonify({'success': False, 'error': 'User not found'}), 401

        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401

        return f(current_user, *args, **kwargs)

    return decorated


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()

        email = data.get('email')
        username = data.get('username')
        password = data.get('password')

        # Validate input
        if not email or not username or not password:
            return jsonify({
                'success': False,
                'error': 'Email, username, and password are required'
            }), 400

        # Check if user already exists
        if any(u['email'] == email for u in users_db.values()):
            return jsonify({
                'success': False,
                'error': 'User with this email already exists'
            }), 409

        # Create new user
        user_id = str(len(users_db) + 1)
        hashed_password = generate_password_hash(password)

        users_db[user_id] = {
            'id': user_id,
            'email': email,
            'username': username,
            'password': hashed_password,
            'createdAt': datetime.datetime.utcnow().isoformat(),
            'watchlist': [],
            'portfolio': [],
            'predictions': [],
            'followers': [],
            'following': [],
            'alerts': []
        }

        # Generate JWT token
        token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, SECRET_KEY, algorithm='HS256')

        # Return user data without password
        user_data = {k: v for k, v in users_db[user_id].items() if k != 'password'}

        return jsonify({
            'success': True,
            'token': token,
            'user': user_data
        }), 201

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Registration failed: {str(e)}'
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login an existing user"""
    try:
        data = request.get_json()

        email = data.get('email')
        password = data.get('password')

        # Validate input
        if not email or not password:
            return jsonify({
                'success': False,
                'error': 'Email and password are required'
            }), 400

        # Find user
        user = None
        user_id = None
        for uid, u in users_db.items():
            if u['email'] == email:
                user = u
                user_id = uid
                break

        if not user:
            return jsonify({
                'success': False,
                'error': 'Invalid email or password'
            }), 401

        # Check password
        if not check_password_hash(user['password'], password):
            return jsonify({
                'success': False,
                'error': 'Invalid email or password'
            }), 401

        # Generate JWT token
        token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, SECRET_KEY, algorithm='HS256')

        # Return user data without password
        user_data = {k: v for k, v in user.items() if k != 'password'}

        return jsonify({
            'success': True,
            'token': token,
            'user': user_data
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Login failed: {str(e)}'
        }), 500


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Get current user profile"""
    user_data = {k: v for k, v in current_user.items() if k != 'password'}
    return jsonify({
        'success': True,
        'user': user_data
    }), 200


@auth_bp.route('/update', methods=['PUT'])
@token_required
def update_user(current_user):
    """Update user profile"""
    try:
        data = request.get_json()

        # Update allowed fields
        allowed_fields = ['username', 'watchlist', 'portfolio', 'predictions', 'alerts']

        for field in allowed_fields:
            if field in data:
                current_user[field] = data[field]

        user_data = {k: v for k, v in current_user.items() if k != 'password'}

        return jsonify({
            'success': True,
            'user': user_data
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Update failed: {str(e)}'
        }), 500


@auth_bp.route('/users', methods=['GET'])
def get_users():
    """Get list of all users (public data only)"""
    public_users = [
        {
            'id': u['id'],
            'username': u['username'],
            'email': u['email'],
            'createdAt': u['createdAt'],
            'followers': u.get('followers', []),
            'following': u.get('following', [])
        }
        for u in users_db.values()
    ]

    return jsonify({
        'success': True,
        'users': public_users
    }), 200
