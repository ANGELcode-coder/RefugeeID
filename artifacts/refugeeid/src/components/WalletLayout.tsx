import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { Home, KeyRound, Settings } from 'lucide-react';

interface WalletLayoutProps {
  children: React.ReactNode;
}

const NAV = [
  { href: '/wallet', icon: Home, label: 'Home' },
  { href: '/wallet/recover', icon: KeyRound, label: 'Recover' },
  { href: '/wallet/settings', icon: Settings, label: 'Settings' },
];

export function WalletLayout({ children }: WalletLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] bg-slate-100 dark:bg-slate-950 flex justify-center sm:py-8">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 sm:rounded-[2rem] sm:shadow-xl overflow-hidden relative flex flex-col sm:border-[8px] border-slate-900">
        {/* Notch simulation for desktop view */}
        <div className="hidden sm:block absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-xl w-32 mx-auto z-50"></div>

        <motion.div
          className="flex-1 flex flex-col overflow-y-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>

        {/* Bottom navigation */}
        <nav className="shrink-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center safe-area-inset-bottom z-20">
          {NAV.map(({ href, icon: Icon, label }) => {
            const isActive = location === href;
            return (
              <Link key={href} href={href} className="flex-1">
                <button className={`w-full flex flex-col items-center gap-1 py-3 transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}>
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium leading-none">{label}</span>
                </button>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
