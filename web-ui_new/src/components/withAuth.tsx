import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { authService } from '@/services/authService';

export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedRoute(props: P) {
    const router = useRouter();

    useEffect(() => {
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        // Redirect to auth page if not authenticated
        router.replace('/auth');
      }
    }, [router]);

    // Show nothing while checking authentication
    if (!authService.isAuthenticated()) {
      return null;
    }

    // Render the protected component if authenticated
    return <Component {...props} />;
  };
}
