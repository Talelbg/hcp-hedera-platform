import React from 'react';
import { Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  alert?: boolean;
  onClick?: () => void;
  tooltip?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp, alert, onClick, tooltip }) => {
  return (
    <div 
        onClick={onClick}
        className={`group relative p-6 rounded-2xl transition-all duration-300 overflow-hidden border
        ${alert 
            ? 'bg-red-500/5 dark:bg-red-500/10 border-red-500/30 hover:border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
            : 'glass-card hover:border-[#2a00ff]/40 hover:shadow-[0_8px_30px_-10px_rgba(42,0,255,0.2)]'
        }
        ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}
        animate-fade-in-up
        `}
    >
      {/* Dynamic Glow Background */}
      <div className={`absolute -right-12 -top-12 w-40 h-40 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none ${alert ? 'bg-red-500' : 'bg-[#2a00ff]'}`}></div>
      <div className={`absolute -left-12 -bottom-12 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none ${alert ? 'bg-orange-500' : 'bg-[#791cf5]'}`}></div>

      <div className="flex justify-between items-start relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className={`text-[11px] font-bold uppercase tracking-widest ${alert ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>{title}</p>
            {tooltip && (
                <div className="group/info relative">
                    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-[#2a00ff] transition-colors cursor-help" />
                    <div className="absolute left-0 top-full mt-2 w-56 p-3 bg-[#1c1b22] border border-white/10 text-slate-300 text-xs rounded-xl shadow-2xl opacity-0 group-hover/info:opacity-100 pointer-events-none z-50 transition-all duration-200 translate-y-2 group-hover/info:translate-y-0 backdrop-blur-md">
                        {tooltip}
                        <div className="absolute -top-1 left-1 w-2 h-2 bg-[#1c1b22] border-t border-l border-white/10 rotate-45"></div>
                    </div>
                </div>
            )}
          </div>
          <h3 className={`text-3xl font-extrabold tracking-tight ${
              alert 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-slate-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all'
          }`}>
              {value}
          </h3>
        </div>
        {icon && (
            <div className={`p-3.5 rounded-xl backdrop-blur-md border transition-all duration-300 shadow-sm ${
                alert 
                  ? 'bg-red-100 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' 
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/10 group-hover:bg-[#2a00ff] group-hover:text-white group-hover:border-[#2a00ff] group-hover:shadow-[0_0_15px_rgba(42,0,255,0.4)] group-hover:scale-110'
            }`}>
                {icon}
            </div>
        )}
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center text-xs font-semibold">
          <span className={`flex items-center gap-1 px-2 py-1 rounded-lg ${trendUp ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 border border-emerald-500/20' : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-500/10 border border-red-500/20'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} 
            {trend}
          </span>
          <span className="text-slate-400 ml-2">vs prev. period</span>
        </div>
      )}
    </div>
  );
};