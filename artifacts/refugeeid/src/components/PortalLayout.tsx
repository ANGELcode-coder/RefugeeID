import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface PortalLayoutProps {
  title: string;
  accentColor: string;
  navItems: NavItem[];
  children: React.ReactNode;
}

export function PortalLayout({ title, accentColor, navItems, children }: PortalLayoutProps) {
  const [location] = useLocation();
  const { signOut } = useAuth();
  const [, setLocation] = useLocation();

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      <div className="p-6">
        <h2 className={`text-xl font-bold ${accentColor}`}>{title}</h2>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  isActive 
                    ? 'bg-slate-800 text-white' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          onClick={handleSignOut}
          data-testid="btn-sign-out"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0">
        <SidebarContent />
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <header className="md:hidden bg-slate-950 text-white h-16 flex items-center px-4 justify-between sticky top-0 z-10">
          <h2 className={`text-lg font-bold ${accentColor}`}>{title}</h2>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-slate-950 border-r-slate-800">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
