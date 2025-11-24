import React from 'react';
import { TrendingUp, AlertCircle, Info } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trendUp?: boolean;
  alert?: boolean;
  tooltip?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trendUp, alert, tooltip, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`glass-panel p-6 rounded-2xl relative group transition-all duration-300 ${onClick ? 'cursor-pointer hover:bg-white/10 hover:border-white/20 hover:-translate-y-1' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${alert ? 'bg-red-500/10 text-red-500' : 'bg-[#2a00ff]/10 text-[#2a00ff]'}`}>
          {icon}
        </div>
        {trendUp !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            <TrendingUp className={`w-3 h-3 ${!trendUp && 'rotate-180'}`} />
            <span>{trendUp ? '+12%' : '-5%'}</span>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
          {title}
          {tooltip && (
            <div className="relative group/tooltip z-20">
              <Info className="w-3 h-3 text-slate-600 hover:text-slate-400" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity">
                {tooltip}
              </div>
            </div>
          )}
        </h3>
        <p className={`text-2xl font-bold ${alert ? 'text-red-500' : 'text-white'}`}>{value}</p>
      </div>

      {alert && (
         <div className="absolute top-2 right-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
         </div>
      )}
    </div>
  );
};
