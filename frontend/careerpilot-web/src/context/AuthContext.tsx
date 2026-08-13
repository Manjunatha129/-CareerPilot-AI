import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { UserResponse, ProfileResponse, LoginRequest, RegisterRequest, ApiResponse, LoginResponse } from '../types';

interface AuthContextType {
  user: UserResponse | null;
  profile: ProfileResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('careerpilot_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const userRes = await apiClient.get<ApiResponse<UserResponse>>('/users/me');
      setUser(userRes.data.data);

      const profileRes = await apiClient.get<ApiResponse<ProfileResponse>>('/profile');
      setProfile(profileRes.data.data);
    } catch (error) {
      console.error('Failed to fetch authenticated user data', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, [token, fetchUserData]);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
      const loginData = res.data.data;
      localStorage.setItem('careerpilot_token', loginData.token);
      setToken(loginData.token);
      setUser(loginData.user);

      // Fetch user profile immediately
      const profileRes = await apiClient.get<ApiResponse<ProfileResponse>>('/profile');
      setProfile(profileRes.data.data);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    await apiClient.post<ApiResponse<UserResponse>>('/auth/register', data);
  };

  const logout = () => {
    localStorage.removeItem('careerpilot_token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (token) {
      const profileRes = await apiClient.get<ApiResponse<ProfileResponse>>('/profile');
      setProfile(profileRes.data.data);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
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
