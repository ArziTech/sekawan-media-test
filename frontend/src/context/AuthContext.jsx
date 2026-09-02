import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState([]);
  const toast = useToast();

  useEffect(() => {
    // Fetch demo users list for easy switching
    api.get('/auth/demo-users')
      .then((res) => {
        if (res.data.success) {
          setDemoUsers(res.data.data);
        }
      })
      .catch((err) => console.error('Error fetching demo users', err));

    // Verify token if present
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('user', JSON.stringify(res.data.data));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password = 'password123') => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        toast.success(`Selamat datang kembali, ${newUser.name}!`);
        return true;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Login gagal. Periksa email & password.';
      toast.error(msg);
      return false;
    }
  };

  const quickSwitchUser = async (email) => {
    return await login(email, 'password123');
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (err) {
      console.warn('Logout error ignored:', err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.info('Anda telah keluar dari aplikasi.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        demoUsers,
        login,
        logout,
        quickSwitchUser,
        isAdmin: user?.role === 'admin',
        isApprover: user?.role === 'approver',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
