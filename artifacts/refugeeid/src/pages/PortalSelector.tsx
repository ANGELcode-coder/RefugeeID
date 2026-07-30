import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import { Wallet, ShieldCheck, FileCheck, LogOut, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PortalSelector() {
  const { user, roles, signOut } = useAuth();

  const portals = [
    {
      id: 'wallet',
      title: 'Holder Wallet',
      description: 'For refugees & displaced persons',
      icon: Wallet,
      color: 'bg-blue-600',
      href: '/wallet',
      role: 'holder',
    },
    {
      id: 'issuer',
      title: 'Issuer Portal',
      description: 'For UNHCR field staff & NGO partners',
      icon: FileCheck,
      color: 'bg-amber-500',
      href: '/issuer',
      role: 'issuer',
    },
    {
      id: 'verifier',
      title: 'Verifier Console',
      description: 'For banks, schools & border control',
      icon: ShieldCheck,
      color: 'bg-emerald-600',
      href: '/verifier',
      role: 'verifier',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            RefugeeID Platform
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Dignified, secure, offline-first digital identity system for displaced persons. 
            Select your portal to continue.
          </p>
          
          {user && (
            <div className="mt-8 flex items-center justify-center gap-4 bg-white py-3 px-6 rounded-full shadow-sm border border-slate-200 inline-flex mx-auto">
              <span className="text-slate-600">Logged in as <strong>{user.email}</strong></span>
              <Button variant="outline" size="sm" onClick={() => signOut()} data-testid="btn-sign-out">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portals.map((portal) => {
            const Icon = portal.icon;
            const hasRole = roles.includes(portal.role as any);
            const canAccess = !user || hasRole;
            
            return (
              <Link key={portal.id} href={portal.href}>
                <div 
                  className={`group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 transition-all cursor-pointer flex flex-col h-full
                    ${canAccess ? 'hover:shadow-md hover:border-slate-300' : 'opacity-60 grayscale cursor-not-allowed'}
                  `}
                  data-testid={`card-portal-${portal.id}`}
                  onClick={(e) => {
                    if (user && !hasRole) e.preventDefault();
                  }}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 ${portal.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{portal.title}</h3>
                  <p className="text-slate-500 flex-1">{portal.description}</p>
                  
                  <div className="mt-6 flex items-center text-sm font-medium text-slate-900">
                    {user && hasRole ? (
                      <span className="flex items-center text-blue-600">
                        Go to my portal <ArrowRight className="h-4 w-4 ml-1" />
                      </span>
                    ) : user && !hasRole ? (
                      <span className="text-slate-400">No access</span>
                    ) : (
                      <span className="flex items-center group-hover:text-blue-600 transition-colors">
                        Sign in to access <ArrowRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
