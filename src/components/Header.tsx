import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();

  // Map paths to titles
  const getTitle = () => {
    switch(location.pathname) {
      case '/dashboard': return 'Dashboard';
      case '/admin': return 'Admin Settings';
      case '/membership': return 'Membership';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="h-16 bg-[#0B0B15] border-b border-gray-800 flex items-center justify-between px-8 fixed top-0 left-64 right-0 z-40">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
            <span className="text-xs font-bold text-purple-400 tracking-wider">HEDERA CERTIFICATION DASHBOARD</span>
            <h1 className="text-xl font-bold text-white">{getTitle()}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800">
           <Sun size={20} />
        </button>
        <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
            SA
        </div>
      </div>
    </header>
  );
};

export default Header;
