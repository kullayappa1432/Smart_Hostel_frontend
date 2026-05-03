'use client';
import { useEffect } from 'react';

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Catch unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Skip 404 errors as they're often expected (e.g., "No menu for today")
      if (event.reason?.response?.status === 404) {
        event.preventDefault();
        return;
      }

      console.error('Unhandled Promise Rejection:', event.reason);
      
      // Prevent default browser behavior
      event.preventDefault();
      
      // Show user-friendly error for non-404 errors
      if (event.reason?.response) {
        const error = event.reason.response;
        console.error('API Error Details:', {
          url: event.reason.config?.url,
          method: event.reason.config?.method,
          status: error.status,
          statusText: error.statusText,
          message: error.data?.message,
          errors: error.data?.errors,
          data: error.data,
        });
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
}
