import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

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
    } catch (error) {
      console.error('Failed to load users from localStorage:', error);
      return [];
    }
  });

  useEffect(() => {
    // Check localStorage availability
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      console.log('localStorage is available');
    } catch (e) {
      console.error('localStorage is NOT available in this browser:', e);
      console.error('This may be due to:');
      console.error('1. Private/InPrivate browsing mode');
      console.error('2. Browser storage disabled in settings');
      console.error('3. Storage quota exceeded');
    }

    // Check if user is logged in
    try {
      const currentUser = localStorage.getItem('stocky_current_user');
      if (currentUser) {
        setUser(JSON.parse(currentUser));
        console.log('User restored from localStorage');
      }
    } catch (error) {
      console.error('Failed to restore user from localStorage:', error);
      localStorage.removeItem('stocky_current_user');
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

  const signup = useCallback((email, password, username) => {
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

    // Batch state updates together
    const userWithoutPassword = { ...newUser };
    delete userWithoutPassword.password;

    // Update both state values in immediate succession for batching
    setUsers(prevUsers => [...prevUsers, newUser]);
    setUser(userWithoutPassword);

    localStorage.setItem('stocky_current_user', JSON.stringify(userWithoutPassword));

    return { success: true, user: userWithoutPassword };
  }, [users]);

  const login = useCallback((email, password) => {
    try {
      console.log('Login attempt:', { email, usersCount: users.length });

      const foundUser = users.find(u => u.email === email && u.password === password);

      if (!foundUser) {
        console.log('Login failed: User not found or password incorrect');
        return { success: false, error: 'Invalid email or password' };
      }

      const userWithoutPassword = { ...foundUser };
      delete userWithoutPassword.password;

      setUser(userWithoutPassword);

      // Test localStorage availability
      try {
        localStorage.setItem('stocky_current_user', JSON.stringify(userWithoutPassword));
        console.log('Login successful, user saved to localStorage');
      } catch (storageError) {
        console.error('localStorage error in Edge:', storageError);
        // Still set user in state even if localStorage fails
        return { success: false, error: 'Storage not available. Try enabling cookies/storage in browser settings.' };
      }

      return { success: true, user: userWithoutPassword };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed: ' + error.message };
    }
  }, [users]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('stocky_current_user');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prevUser => {
      const updatedUser = { ...prevUser, ...updates };
      localStorage.setItem('stocky_current_user', JSON.stringify(updatedUser));

      // Update in users array
      setUsers(prevUsers => prevUsers.map(u =>
        u.id === prevUser.id ? { ...u, ...updates } : u
      ));

      return updatedUser;
    });
  }, []);

  const followUser = useCallback((targetUserId) => {
    if (!user) return { success: false, error: 'Not logged in' };

    const following = user.following || [];
    if (following.includes(targetUserId)) {
      return { success: false, error: 'Already following' };
    }

    const currentUserId = user.id;
    const newFollowing = [...following, targetUserId];
    updateUser({ following: newFollowing });

    // Update target user's followers
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === targetUserId) {
        const followers = u.followers || [];
        return { ...u, followers: [...followers, currentUserId] };
      }
      return u;
    }));

    return { success: true };
  }, [user, updateUser]);

  const unfollowUser = useCallback((targetUserId) => {
    if (!user) return { success: false, error: 'Not logged in' };

    const currentUserId = user.id;
    const following = user.following || [];
    const newFollowing = following.filter(id => id !== targetUserId);
    updateUser({ following: newFollowing });

    // Update target user's followers
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === targetUserId) {
        const followers = u.followers || [];
        return { ...u, followers: followers.filter(id => id !== currentUserId) };
      }
      return u;
    }));

    return { success: true };
  }, [user, updateUser]);

  const getPublicUsers = useCallback(() => {
    // Return users without passwords
    return users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      createdAt: u.createdAt,
      followers: u.followers || [],
      following: u.following || []
    }));
  }, [users]);

  const getUserById = useCallback((userId) => {
    const foundUser = users.find(u => u.id === userId);
    if (!foundUser) return null;

    const publicUser = { ...foundUser };
    delete publicUser.password;
    return publicUser;
  }, [users]);

  // Memoize public users to prevent infinite re-renders
  const publicUsers = useMemo(() => getPublicUsers(), [getPublicUsers]);

  const value = useMemo(() => ({
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
    users: publicUsers
  }), [user, publicUsers, signup, login, logout, updateUser, followUser, unfollowUser, getPublicUsers, getUserById]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
