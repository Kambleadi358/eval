import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X, LayoutDashboard, Trophy, Users, Camera, Settings, FileText } from 'lucide-react';
import { useState } from 'react';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut, adminEmail } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: '/admin', label: 'डॅशबोर्ड', icon: LayoutDashboard },
    { path: '/admin/competition', label: 'स्पर्धा', icon: Trophy },
    { path: '/admin/judges', label: 'परीक्षक', icon: Users },
    { path: '/admin/entries', label: 'नोंदणी', icon: Camera },
    { path: '/admin/reports', label: 'अहवाल', icon: FileText },
    { path: '/admin/settings', label: 'सेटिंग्ज', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient sticky top-0 z-50 border-b border-primary/20">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-primary-foreground">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/admin" className="text-primary-foreground font-bold text-sm md:text-base">
              विचारमंच • स्पर्धा व्यवस्थापन
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary-foreground/70 text-xs hidden sm:block">{adminEmail}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-primary-foreground hover:bg-primary/30">
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <nav className="md:hidden hero-gradient border-b border-primary/20 animate-fade-in">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 text-sm ${
                location.pathname === item.path ? 'bg-primary/20 text-accent' : 'text-primary-foreground'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      <div className="flex">
        <aside className="hidden md:flex flex-col w-56 min-h-[calc(100vh-3.5rem)] hero-gradient border-r border-primary/20">
          <nav className="flex flex-col p-2 gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary/20 text-accent font-semibold'
                    : 'text-primary-foreground/80 hover:bg-primary/10 hover:text-primary-foreground'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-6 max-w-6xl">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
