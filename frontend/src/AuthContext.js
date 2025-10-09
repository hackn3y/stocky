import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState(() => {
    try {
      const stored = localStorage.getItem('stocky_users');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    // Check if user is logged in
    const currentUser = localStorage.getItem('stocky_current_user');
    if (currentUser) {
      try {
        setUser(JSON.parse(currentUser));
      } catch {
        localStorage.removeItem('stocky_current_user');
      }
    }
  }, []);

  useEffect(() => {
    // Save users to localStorage
    try {
      localStorage.setItem('stocky_users', JSON.stringify(users));
    } catch (error) {
      console.error('Failed to save users:', error);
    }
  }, [users]);

  const signup = (email, password, username) => {
    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return { success: false, error: 'User already exists' };
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      username,
      password, // In production, this should be hashed
      createdAt: new Date().toISOString(),
      watchlist: [],
      portfolio: [],
      predictions: [],
      followers: [],
      following: [],
      alerts: []
    };

    setUsers([...users, newUser]);

    // Auto-login after signup
    const userWithoutPassword = { ...newUser };
    delete userWithoutPassword.password;
    setUser(userWithoutPassword);
    localStorage.setItem('stocky_current_user', JSON.stringify(userWithoutPassword));

    return { success: true, user: userWithoutPassword };
  };

  const login = (email, password) => {
    const foundUser = users.find(u => u.email === email && u.password === password);

    if (!foundUser) {
      return { success: false, error: 'Invalid email or password' };
    }

    const userWithoutPassword = { ...foundUser };
    delete userWithoutPassword.password;
    setUser(userWithoutPassword);
    localStorage.setItem('stocky_current_user', JSON.stringify(userWithoutPassword));

    return { success: true, user: userWithoutPassword };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stocky_current_user');
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('stocky_current_user', JSON.stringify(updatedUser));

    // Update in users array
    setUsers(users.map(u => u.id === user.id ? { ...u, ...updates } : u));
  };

  const followUser = (targetUserId) => {
    if (!user) return { success: false, error: 'Not logged in' };

    const following = user.following || [];
    if (following.includes(targetUserId)) {
      return { success: false, error: 'Already following' };
    }

    const newFollowing = [...following, targetUserId];
    updateUser({ following: newFollowing });

    // Update target user's followers
    setUsers(users.map(u => {
      if (u.id === targetUserId) {
        const followers = u.followers || [];
        return { ...u, followers: [...followers, user.id] };
      }
      return u;
    }));

    return { success: true };
  };

  const unfollowUser = (targetUserId) => {
    if (!user) return { success: false, error: 'Not logged in' };

    const following = user.following || [];
    const newFollowing = following.filter(id => id !== targetUserId);
    updateUser({ following: newFollowing });

    // Update target user's followers
    setUsers(users.map(u => {
      if (u.id === targetUserId) {
        const followers = u.followers || [];
        return { ...u, followers: followers.filter(id => id !== user.id) };
      }
      return u;
    }));

    return { success: true };
  };

  const getPublicUsers = () => {
    // Return users without passwords
    return users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      createdAt: u.createdAt,
      followers: u.followers || [],
      following: u.following || []
    }));
  };

  const getUserById = (userId) => {
    const foundUser = users.find(u => u.id === userId);
    if (!foundUser) return null;

    const publicUser = { ...foundUser };
    delete publicUser.password;
    return publicUser;
  };

  const value = {
    user,
    isAuthenticated: !!user,
    signup,
    login,
    logout,
    updateUser,
    followUser,
    unfollowUser,
    getPublicUsers,
    getUserById,
    users: getPublicUsers()
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
