import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Crown,
  Users,
  Send,
  FileText,
  BarChart2,
  Calendar,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const Sidebar: React.FC = () => {
  const { role } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Membership', path: '/membership', icon: <Crown size={20} /> },
    { name: 'Developers & Fraud', path: '/developers', icon: <Users size={20} /> },
    { name: 'Smart Outreach', path: '/outreach', icon: <Send size={20} /> },
    { name: 'Finance & Invoices', path: '/finance', icon: <FileText size={20} /> },
    { name: 'Reporting & AI', path: '/reporting', icon: <BarChart2 size={20} /> },
    { name: 'Event Management', path: '/events', icon: <Calendar size={20} /> },
  ];

  return (
    <div className="w-64 bg-[#0B0B15] border-r border-gray-800 flex flex-col h-screen fixed left-0 top-0 z-50">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
            </div>
             <span className="text-white font-bold text-lg">Dar Blockchain™</span>
         </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive || (item.path === '/dashboard' && location.pathname === '/')
                    ? 'bg-[#1E1B3A] text-white border-l-4 border-primary'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom Area: Admin & Logout */}
      <div className="p-4 border-t border-gray-800">
        <div className="space-y-1">
          {role === 'super_admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#1E1B3A] text-white border-l-4 border-primary'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span className="mr-3"><ShieldCheck size={20} /></span>
              Admin Settings
            </NavLink>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          >
            <span className="mr-3"><LogOut size={20} /></span>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
