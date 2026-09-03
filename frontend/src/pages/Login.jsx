import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/components/login-form';
import { ModeToggle } from '@/components/mode-toggle';

export const Login = () => {
  const { user, loading, isApprover } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to={isApprover ? "/approvals" : "/dashboard"} replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ModeToggle />
      </div>
      <div className="w-full max-w-4xl">
        <LoginForm />
      </div>
    </div>
  );
};
