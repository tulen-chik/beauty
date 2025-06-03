'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, isInitialized } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

//   useEffect(() => {
//     if (isInitialized && !isLoading) {
//       const currentPath = window.location.pathname;
//       const locale = currentPath.split('/')[1];
//       const loginPath = `/${locale}/auth/login`;
      
//       if (currentPath !== loginPath && !user) {
//         router.push(`${loginPath}?callbackUrl=${encodeURIComponent(currentPath)}`);
//       }
//     }
//   }, [user, isLoading, isInitialized, router]);

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF4400]"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
} 