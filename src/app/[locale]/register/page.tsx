"use client";
import { AuthForm } from '@/components/auth/AuthForm';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const Loading = () => <LoadingSpinner />;
 
export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthForm mode="register" />
    </Suspense>
  );
}