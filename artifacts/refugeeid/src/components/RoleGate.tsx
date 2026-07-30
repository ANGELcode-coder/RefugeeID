import React, { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { AppRole } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface RoleGateProps {
  role: AppRole | AppRole[];
  children: React.ReactNode;
}

export function RoleGate({ role, children }: RoleGateProps) {
  const { user, roles, loading } = useAuth();
  const [, setLocation] = useLocation();

  const allowedRoles = Array.isArray(role) ? role : [role];

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setLocation(`/auth?portal=${allowedRoles[0]}`);
      }
    }
  }, [user, loading, allowedRoles, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const hasAccess = allowedRoles.some(r => roles.includes(r));

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
        <p className="text-muted-foreground mb-4">You do not have the required role to access this portal.</p>
        <button 
          onClick={() => setLocation('/')}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
        >
          Return Home
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
