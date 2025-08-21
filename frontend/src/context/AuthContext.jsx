import React, { createContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isSubscribed = true;
    const fetchMe = async () => {
      try {
        if (!token) return;
        const res = await authApi.me();
        if (isSubscribed) setUser(res.data);
      } catch {
        localStorage.removeItem('token');
        if (isSubscribed) {
          setToken(null);
          setUser(null);
        }
      }
    };
    fetchMe();
    return () => { isSubscribed = false; };
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    const { token: newToken, user: nextUser } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(nextUser);
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authApi.register(name, email, password);
    const { token: newToken, user: nextUser } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


