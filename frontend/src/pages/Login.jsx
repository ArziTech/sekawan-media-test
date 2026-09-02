import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/components/login-form';

export const Login = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl">
        <LoginForm />
        <p className="text-center text-xs text-muted-foreground mt-6">
          PT Tambang Nikel Nusantara &copy; 2026 &middot; Nickel Fleet Management System
        </p>
      </div>
    </div>
  );
};
