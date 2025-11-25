import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ShieldAlert, Upload, List, UserPlus, Menu, X, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: '/subscriptions', label: 'Subscriptions', icon: List },
    { id: '/import', label: 'Import Data', icon: Upload },
    { id: '/import-community', label: 'Import Community', icon: UserPlus },
    { id: '/admin', label: 'Admin & Leaders', icon: ShieldAlert, allowedRoles: ['super_admin'] },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const NavContent = () => (
    <>
      {/* Brand Header */}
      <div className="h-28 flex items-center px-8 border-b border-white/5 relative z-10 cursor-pointer" onClick={() => handleNavigation('/dashboard')}>
        <div className="relative group flex items-center gap-3">
            {/* Dar Blockchain Logo Shape */}
            <svg width="40" height="40" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden="true">
                <path d="M10 25H0V45C0 47.7614 2.23858 50 5 50H15V25C15 19.4772 19.4772 15 25 15C30.5228 15 35 19.4772 35 25V50H45C47.7614 50 50 47.7614 50 45V25C50 11.1929 38.8071 0 25 0H15V10C15 12.7614 12.7614 15 10 15V25Z" fill="#2a00ff"/>
            </svg>
            <div>
                <h1 className="font-extrabold text-xl leading-none text-white tracking-tight">Dar <br/>Blockchain<span className="align-top text-[8px] text-slate-500 ml-0.5">TM</span></h1>
            </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 space-y-2 px-4 relative z-10 overflow-y-auto" role="navigation" aria-label="Main navigation">
        {navItems.map((item) => {
          if (item.allowedRoles && (!role || !item.allowedRoles.includes(role))) {
              return null;
          }
          const isActive = location.pathname === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 relative group overflow-hidden cursor-pointer ${
                isActive
                  ? 'text-white shadow-[0_0_20px_rgba(42,0,255,0.25)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#2a00ff] to-[#791cf5] opacity-20 border-l-2 border-[#2a00ff]"></div>
              )}

              <item.icon className={`w-5 h-5 transition-all duration-300 relative z-10 ${isActive ? 'text-[#2a00ff] drop-shadow-[0_0_8px_rgba(42,0,255,0.8)]' : 'group-hover:scale-110'}`} aria-hidden="true" />
              <span className={`ml-3 text-sm font-medium tracking-wide relative z-10 ${isActive ? 'text-white font-bold' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-6 border-t border-white/5 bg-[#141319] relative z-10">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2a00ff] to-[#791cf5] flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-[#2a00ff]/30">
            {role === 'super_admin' ? 'SA' : role === 'regional' ? 'RA' : role === 'community' ? 'CA' : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white group-hover:text-[#a522dd] transition-colors truncate">
                {role === 'super_admin' ? 'Super Admin' : role === 'regional' ? 'Regional Admin' : role === 'community' ? 'Community Admin' : 'User'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Online</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-slate-400 hover:text-white" aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-[150] p-3 rounded-xl bg-[#141319] border border-white/10 text-white shadow-lg"
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <div 
        className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-[#141319] border-r border-white/5 flex flex-col z-[120] transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        {/* Background Glow Effect */}
        <div className="absolute top-0 left-0 w-full h-96 bg-[#2a00ff]/10 blur-[100px] pointer-events-none"></div>
        <NavContent />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-72 bg-[#141319] border-r border-white/5 flex-col h-screen fixed left-0 top-0 z-[100] shadow-2xl overflow-hidden">
        {/* Background Glow Effect */}
        <div className="absolute top-0 left-0 w-full h-96 bg-[#2a00ff]/10 blur-[100px] pointer-events-none"></div>
        <NavContent />
      </div>
    </>
  );
};
