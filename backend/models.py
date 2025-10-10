"""
Database models for Stock Predictor
Uses Peewee ORM with SQLite (local) or PostgreSQL (production)
"""
from peewee import *
from playhouse.db_url import connect
from datetime import datetime
import json
import os

# Database configuration
# Priority: DATABASE_URL (PostgreSQL) > DATABASE_PATH (SQLite) > default SQLite
DATABASE_URL = os.environ.get('DATABASE_URL')
DATABASE_PATH = os.environ.get('DATABASE_PATH', 'stocky.db')

if DATABASE_URL:
    # Production: Use PostgreSQL from Railway
    db = connect(DATABASE_URL)
    print(f"[OK] Using PostgreSQL database")
else:
    # Local: Use SQLite
    db = SqliteDatabase(DATABASE_PATH)
    print(f"[OK] Using SQLite database: {DATABASE_PATH}")


class BaseModel(Model):
    """Base model with database configuration"""
    class Meta:
        database = db


class User(BaseModel):
    """User model for authentication and user data"""
    email = CharField(unique=True, index=True)
    username = CharField()
    password = CharField()  # Hashed password
    created_at = DateTimeField(default=datetime.utcnow)

    # User data stored as JSON
    watchlist = TextField(default='[]')
    portfolio = TextField(default='[]')
    predictions = TextField(default='[]')
    followers = TextField(default='[]')
    following = TextField(default='[]')
    alerts = TextField(default='[]')

    class Meta:
        table_name = 'users'

    def to_dict(self, include_password=False):
        """Convert user to dictionary"""
        data = {
            'id': str(self.id),
            'email': self.email,
            'username': self.username,
            'createdAt': self.created_at.isoformat(),
            'watchlist': json.loads(self.watchlist),
            'portfolio': json.loads(self.portfolio),
            'predictions': json.loads(self.predictions),
            'followers': json.loads(self.followers),
            'following': json.loads(self.following),
            'alerts': json.loads(self.alerts)
        }

        if include_password:
            data['password'] = self.password

        return data

    def update_field(self, field_name, value):
        """Update a JSON field"""
        if field_name in ['watchlist', 'portfolio', 'predictions', 'followers', 'following', 'alerts']:
            setattr(self, field_name, json.dumps(value))
            self.save()
            return True
        return False


class Alert(BaseModel):
    """Alert model for price alerts"""
    user = ForeignKeyField(User, backref='user_alerts')
    symbol = CharField()
    condition = CharField()  # 'above' or 'below'
    target_price = FloatField()
    current_price = FloatField()
    triggered = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.utcnow)
    triggered_at = DateTimeField(null=True)

    class Meta:
        table_name = 'alerts'

    def to_dict(self):
        """Convert alert to dictionary"""
        return {
            'id': self.id,
            'user_id': str(self.user.id),
            'symbol': self.symbol,
            'condition': self.condition,
            'target_price': self.target_price,
            'current_price': self.current_price,
            'triggered': self.triggered,
            'created_at': self.created_at.isoformat(),
            'triggered_at': self.triggered_at.isoformat() if self.triggered_at else None
        }


class Post(BaseModel):
    """Social feed post model"""
    user = ForeignKeyField(User, backref='posts')
    content = TextField()
    symbol = CharField(null=True)
    prediction = CharField(null=True)  # 'UP' or 'DOWN'
    likes = IntegerField(default=0)
    created_at = DateTimeField(default=datetime.utcnow)

    class Meta:
        table_name = 'posts'

    def to_dict(self):
        """Convert post to dictionary"""
        return {
            'id': self.id,
            'user_id': str(self.user.id),
            'username': self.user.username,
            'content': self.content,
            'symbol': self.symbol,
            'prediction': self.prediction,
            'likes': self.likes,
            'created_at': self.created_at.isoformat()
        }


def initialize_database():
    """Initialize database and create tables"""
    try:
        db.connect()
        db.create_tables([User, Alert, Post], safe=True)
        db_name = DATABASE_URL if DATABASE_URL else DATABASE_PATH
        print(f"[OK] Database initialized: {db_name}")
        print(f"[OK] Tables created: User, Alert, Post")
        return True
    except Exception as e:
        print(f"[ERROR] Database initialization failed: {e}")
        return False
    finally:
        if not db.is_closed():
            db.close()


def get_db():
    """Get database connection"""
    if db.is_closed():
        db.connect()
    return db


def close_db():
    """Close database connection"""
    if not db.is_closed():
        db.close()


# Initialize database when module is imported
if __name__ != '__main__':
    initialize_database()
