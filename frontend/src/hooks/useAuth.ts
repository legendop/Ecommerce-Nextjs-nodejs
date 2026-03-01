'use client';

import { useAuthStore } from '@/stores/authStore';

// Simple hook to access auth store - AuthProvider handles fetching
export function useAuth() {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin: user?.role === 'ADMIN',
    logout,
  };
}
