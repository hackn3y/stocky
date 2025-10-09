import React, { useState } from 'react';
import { Users, UserPlus, UserMinus, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { useAuth } from './AuthContext';

function SocialFeed({ darkMode }) {
  const { user, users, followUser, unfollowUser, getUserById } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-600' : 'border-gray-300';

  if (!user) {
    return (
      <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-blue-500" />
          <h3 className={`text-xl font-bold ${textPrimary}`}>Social Feed</h3>
        </div>
        <p className={textSecondary}>Login to see community predictions and follow users.</p>
      </div>
    );
  }

  const following = user.following || [];
  const isFollowing = (userId) => following.includes(userId);

  const handleFollow = (userId) => {
    if (isFollowing(userId)) {
      unfollowUser(userId);
    } else {
      followUser(userId);
    }
  };

  // Get predictions from followed users
  const getFeed = () => {
    const feed = [];
    following.forEach(userId => {
      const followedUser = getUserById(userId);
      if (followedUser && followedUser.predictions) {
        followedUser.predictions.slice(0, 5).forEach(pred => {
          feed.push({
            ...pred,
            user: followedUser
          });
        });
      }
    });
    // Sort by date
    return feed.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
  };

  const getDiscoverUsers = () => {
    return users.filter(u => u.id !== user.id);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Recent';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const feed = getFeed();
  const discoverUsers = getDiscoverUsers();

  return (
    <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-blue-500" />
        <h3 className={`text-xl font-bold ${textPrimary}`}>Social Feed</h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-300 dark:border-gray-600">
        <button
          onClick={() => setActiveTab('feed')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'feed'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : textSecondary
          }`}
        >
          Feed ({feed.length})
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'discover'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : textSecondary
          }`}
        >
          Discover ({discoverUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'following'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : textSecondary
          }`}
        >
          Following ({following.length})
        </button>
      </div>

      {/* Feed Tab */}
      {activeTab === 'feed' && (
        <div className="space-y-3">
          {feed.length === 0 ? (
            <p className={textSecondary}>
              Follow users to see their predictions in your feed!
            </p>
          ) : (
            feed.map((item, index) => (
              <div key={index} className={`p-4 border ${borderColor} rounded-lg`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className={`font-semibold ${textPrimary}`}>
                      {item.user.username}
                    </p>
                    <p className={`text-xs ${textSecondary} flex items-center gap-1`}>
                      <Clock className="h-3 w-3" />
                      {formatTime(item.date)}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 ${
                    item.prediction === 'UP' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.prediction === 'UP' ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                    <span className="font-bold">{item.symbol}</span>
                  </div>
                </div>
                <div className="text-sm">
                  <span className={textSecondary}>Prediction: </span>
                  <span className={`font-semibold ${textPrimary}`}>
                    {item.prediction}
                  </span>
                  <span className={textSecondary}> with </span>
                  <span className={`font-semibold ${textPrimary}`}>
                    {item.confidence.toFixed(1)}% confidence
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Discover Tab */}
      {activeTab === 'discover' && (
        <div className="space-y-3">
          {discoverUsers.map((u) => (
            <div key={u.id} className={`p-4 border ${borderColor} rounded-lg flex items-center justify-between`}>
              <div>
                <p className={`font-semibold ${textPrimary}`}>{u.username}</p>
                <p className={`text-sm ${textSecondary}`}>
                  {u.followers?.length || 0} followers • {u.following?.length || 0} following
                </p>
              </div>
              <button
                onClick={() => handleFollow(u.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isFollowing(u.id)
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isFollowing(u.id) ? (
                  <>
                    <UserMinus className="h-4 w-4" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Follow
                  </>
                )}
              </button>
            </div>
          ))}
          {discoverUsers.length === 0 && (
            <p className={textSecondary}>No users to discover yet.</p>
          )}
        </div>
      )}

      {/* Following Tab */}
      {activeTab === 'following' && (
        <div className="space-y-3">
          {following.map((userId) => {
            const followedUser = getUserById(userId);
            if (!followedUser) return null;
            return (
              <div key={userId} className={`p-4 border ${borderColor} rounded-lg flex items-center justify-between`}>
                <div>
                  <p className={`font-semibold ${textPrimary}`}>{followedUser.username}</p>
                  <p className={`text-sm ${textSecondary}`}>
                    {followedUser.followers?.length || 0} followers
                  </p>
                </div>
                <button
                  onClick={() => handleFollow(userId)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                  <UserMinus className="h-4 w-4" />
                  Unfollow
                </button>
              </div>
            );
          })}
          {following.length === 0 && (
            <p className={textSecondary}>You're not following anyone yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default SocialFeed;
