"""
Authentication endpoints for the Stock Predictor API
Handles user registration, login, and JWT token management
Now uses Peewee ORM with SQLite database for persistence
"""
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
import os
import json
from models import User, get_db, close_db
from peewee import IntegrityError

auth_bp = Blueprint('auth', __name__)

# Secret key for JWT (in production, use environment variable)
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')


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

            # Get user from database
            get_db()
            current_user = User.get_by_id(data['user_id'])

        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401
        except User.DoesNotExist:
            return jsonify({'success': False, 'error': 'User not found'}), 401
        except Exception as e:
            return jsonify({'success': False, 'error': f'Authentication failed: {str(e)}'}), 401

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

        # Ensure database is connected
        get_db()

        # Check if user already exists
        if User.select().where(User.email == email).exists():
            return jsonify({
                'success': False,
                'error': 'User with this email already exists'
            }), 409

        # Create new user
        hashed_password = generate_password_hash(password)

        user = User.create(
            email=email,
            username=username,
            password=hashed_password,
            watchlist='[]',
            portfolio='[]',
            predictions='[]',
            followers='[]',
            following='[]',
            alerts='[]'
        )

        # Generate JWT token
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, SECRET_KEY, algorithm='HS256')

        # Return user data without password
        user_data = user.to_dict(include_password=False)

        return jsonify({
            'success': True,
            'token': token,
            'user': user_data
        }), 201

    except IntegrityError:
        return jsonify({
            'success': False,
            'error': 'User with this email already exists'
        }), 409
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

        # Ensure database is connected
        get_db()

        # Find user
        try:
            user = User.get(User.email == email)
        except User.DoesNotExist:
            return jsonify({
                'success': False,
                'error': 'Invalid email or password'
            }), 401

        # Check password
        if not check_password_hash(user.password, password):
            return jsonify({
                'success': False,
                'error': 'Invalid email or password'
            }), 401

        # Generate JWT token
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, SECRET_KEY, algorithm='HS256')

        # Return user data without password
        user_data = user.to_dict(include_password=False)

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
    user_data = current_user.to_dict(include_password=False)
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
                if field == 'username':
                    current_user.username = data[field]
                else:
                    # JSON fields
                    current_user.update_field(field, data[field])

        if 'username' in data:
            current_user.save()

        user_data = current_user.to_dict(include_password=False)

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
    try:
        get_db()

        users = User.select()
        public_users = []

        for user in users:
            public_users.append({
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'createdAt': user.created_at.isoformat(),
                'followers': json.loads(user.followers),
                'following': json.loads(user.following)
            })

        return jsonify({
            'success': True,
            'users': public_users
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to fetch users: {str(e)}'
        }), 500


@auth_bp.route('/follow/<int:target_user_id>', methods=['POST'])
@token_required
def follow_user(current_user, target_user_id):
    """Follow another user"""
    try:
        get_db()

        # Check if target user exists
        try:
            target_user = User.get_by_id(target_user_id)
        except User.DoesNotExist:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404

        # Get current following list
        following = json.loads(current_user.following)

        if str(target_user_id) in following:
            return jsonify({
                'success': False,
                'error': 'Already following this user'
            }), 400

        # Add to following
        following.append(str(target_user_id))
        current_user.update_field('following', following)

        # Add to target's followers
        followers = json.loads(target_user.followers)
        followers.append(str(current_user.id))
        target_user.update_field('followers', followers)

        return jsonify({
            'success': True,
            'message': f'Now following {target_user.username}'
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Follow failed: {str(e)}'
        }), 500


@auth_bp.route('/unfollow/<int:target_user_id>', methods=['POST'])
@token_required
def unfollow_user(current_user, target_user_id):
    """Unfollow a user"""
    try:
        get_db()

        # Check if target user exists
        try:
            target_user = User.get_by_id(target_user_id)
        except User.DoesNotExist:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404

        # Get current following list
        following = json.loads(current_user.following)

        if str(target_user_id) not in following:
            return jsonify({
                'success': False,
                'error': 'Not following this user'
            }), 400

        # Remove from following
        following.remove(str(target_user_id))
        current_user.update_field('following', following)

        # Remove from target's followers
        followers = json.loads(target_user.followers)
        if str(current_user.id) in followers:
            followers.remove(str(current_user.id))
            target_user.update_field('followers', followers)

        return jsonify({
            'success': True,
            'message': f'Unfollowed {target_user.username}'
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Unfollow failed: {str(e)}'
        }), 500
