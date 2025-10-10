import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// API URL for backend
const API_URL = process.env.REACT_APP_API_URL || 'https://stocky-production-16bc.up.railway.app/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('stocky_token') || null;
    } catch {
      return null;
    }
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // If we have a token, fetch current user
    const fetchCurrentUser = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data.success) {
            setUser(response.data.user);
            console.log('User restored from backend');
          }
        } catch (error) {
          console.error('Failed to restore user from backend:', error);
          // Token invalid or expired, clear it
          localStorage.removeItem('stocky_token');
          setToken(null);
          setUser(null);
        }
      }
    };

    fetchCurrentUser();
  }, [token]);

  useEffect(() => {
    // Fetch all users for social features
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/users`);
        if (response.data.success) {
          setUsers(response.data.users);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, []);

  const signup = useCallback(async (email, password, username) => {
    try {
      console.log('Signup attempt:', { email, username });

      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        username
      });

      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data;

        // Save token to localStorage
        localStorage.setItem('stocky_token', newToken);
        setToken(newToken);
        setUser(newUser);

        // Refresh users list
        const usersResponse = await axios.get(`${API_URL}/auth/users`);
        if (usersResponse.data.success) {
          setUsers(usersResponse.data.users);
        }

        console.log('Signup successful');
        return { success: true, user: newUser };
      }

      return { success: false, error: response.data.error || 'Signup failed' };
    } catch (error) {
      console.error('Signup error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Signup failed';
      return { success: false, error: errorMsg };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      console.log('Login attempt:', { email });

      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data;

        // Save token to localStorage
        localStorage.setItem('stocky_token', newToken);
        setToken(newToken);
        setUser(newUser);

        console.log('Login successful');
        return { success: true, user: newUser };
      }

      return { success: false, error: response.data.error || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Login failed';
      return { success: false, error: errorMsg };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('stocky_token');
    console.log('User logged out');
  }, []);

  const updateUser = useCallback(async (updates) => {
    if (!token) {
      console.error('No token available for update');
      return;
    }

    try {
      const response = await axios.put(`${API_URL}/auth/update`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUser(response.data.user);
        console.log('User updated successfully');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  }, [token]);

  const followUser = useCallback(async (targetUserId) => {
    if (!user || !token) return { success: false, error: 'Not logged in' };

    try {
      const response = await axios.post(`${API_URL}/auth/follow/${targetUserId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Refresh current user and users list
        const meResponse = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (meResponse.data.success) {
          setUser(meResponse.data.user);
        }

        const usersResponse = await axios.get(`${API_URL}/auth/users`);
        if (usersResponse.data.success) {
          setUsers(usersResponse.data.users);
        }

        return { success: true };
      }

      return { success: false, error: response.data.error };
    } catch (error) {
      console.error('Follow error:', error);
      return { success: false, error: error.response?.data?.error || 'Follow failed' };
    }
  }, [user, token]);

  const unfollowUser = useCallback(async (targetUserId) => {
    if (!user || !token) return { success: false, error: 'Not logged in' };

    try {
      const response = await axios.post(`${API_URL}/auth/unfollow/${targetUserId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Refresh current user and users list
        const meResponse = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (meResponse.data.success) {
          setUser(meResponse.data.user);
        }

        const usersResponse = await axios.get(`${API_URL}/auth/users`);
        if (usersResponse.data.success) {
          setUsers(usersResponse.data.users);
        }

        return { success: true };
      }

      return { success: false, error: response.data.error };
    } catch (error) {
      console.error('Unfollow error:', error);
      return { success: false, error: error.response?.data?.error || 'Unfollow failed' };
    }
  }, [user, token]);

  const getPublicUsers = useCallback(() => {
    return users;
  }, [users]);

  const getUserById = useCallback((userId) => {
    return users.find(u => u.id === userId) || null;
  }, [users]);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    token,
    signup,
    login,
    logout,
    updateUser,
    followUser,
    unfollowUser,
    getPublicUsers,
    getUserById,
    users
  }), [user, token, users, signup, login, logout, updateUser, followUser, unfollowUser, getPublicUsers, getUserById]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
