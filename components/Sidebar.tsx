import React from 'react';
import { LayoutDashboard, FileText, Users, Calendar, ShieldAlert, Send, Crown, BarChart, ChevronRight } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'membership', label: 'Membership', icon: Crown },
    { id: 'developers', label: 'Developers & Fraud', icon: Users },
    { id: 'outreach', label: 'Smart Outreach', icon: Send },
    { id: 'invoices', label: 'Finance & Invoices', icon: FileText },
    { id: 'reporting', label: 'Reporting & AI', icon: BarChart },
    { id: 'events', label: 'Event Management', icon: Calendar },
    { id: 'admin', label: 'Admin Settings', icon: ShieldAlert },
  ];

  return (
    <div className="w-20 lg:w-72 bg-[#141319] border-r border-white/5 flex flex-col min-h-screen z-50 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background Glow Effect */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#2a00ff]/10 to-transparent blur-[80px] pointer-events-none"></div>

      {/* Brand Header */}
      <div className="h-24 flex items-center justify-center lg:justify-start lg:px-8 border-b border-white/5 relative z-10">
        <div className="relative group cursor-pointer flex items-center gap-3">
            {/* Logo Abstract Shape */}
            <div className="relative">
                <div className="absolute inset-0 bg-[#2a00ff] blur-lg opacity-40 group-hover:opacity-60 transition-opacity rounded-full"></div>
                <svg width="42" height="42" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 relative z-10 transition-transform duration-300 group-hover:rotate-3">
                    <path d="M10 25H0V45C0 47.7614 2.23858 50 5 50H15V25C15 19.4772 19.4772 15 25 15C30.5228 15 35 19.4772 35 25V50H45C47.7614 50 50 47.7614 50 45V25C50 11.1929 38.8071 0 25 0H15V10C15 12.7614 12.7614 15 10 15V25Z" fill="#2a00ff"/>
                </svg>
            </div>
            <div className="hidden lg:block">
                <h1 className="font-extrabold text-xl leading-none text-white tracking-tight">Dar <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Blockchain</span></h1>
            </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 space-y-1.5 px-3 relative z-10 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 relative group overflow-hidden ${
                isActive 
                  ? 'bg-white/5 text-white shadow-[0_4px_20px_-5px_rgba(42,0,255,0.4)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#2a00ff] to-[#791cf5] shadow-[0_0_10px_#2a00ff]"></div>
              )}
              
              <item.icon className={`w-5 h-5 transition-all duration-300 relative z-10 ${isActive ? 'text-[#2a00ff] scale-110 drop-shadow-[0_0_8px_rgba(42,0,255,0.8)]' : 'group-hover:text-slate-300'}`} />
              <span className={`ml-3 text-sm font-medium tracking-wide hidden lg:block relative z-10 ${isActive ? 'text-white font-semibold' : ''}`}>{item.label}</span>
              
              {isActive && <ChevronRight className="w-4 h-4 ml-auto text-[#2a00ff] hidden lg:block animate-pulse" />}

              {/* Mobile Tooltip */}
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#1c1b22] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 lg:hidden whitespace-nowrap z-50 pointer-events-none shadow-xl border border-white/10 transition-opacity">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5 bg-[#141319] relative z-10">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-white/5 to-transparent hover:from-white/10 transition-all cursor-pointer border border-white/5 group shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2a00ff] to-[#791cf5] flex items-center justify-center text-xs font-extrabold text-white shadow-[0_0_15px_rgba(42,0,255,0.4)] relative overflow-hidden">
             <div className="absolute inset-0 bg-white/20 group-hover:animate-pulse"></div>
             SA
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-bold text-white group-hover:text-[#2a00ff] transition-colors">Super Admin</p>
            <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Online</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};