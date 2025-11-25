import React from 'react';

// Simple skeleton shimmer component
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-700/50 rounded ${className}`} />
);

// Compact dashboard loading skeleton
export const DashboardSkeleton: React.FC = () => (
  <div className="p-8 space-y-6">
    <div className="glass-panel p-6 rounded-2xl bg-[#1c1b22]">
      <Skeleton className="w-48 h-8 mb-4" />
      <div className="flex gap-4">
        <Skeleton className="w-48 h-10 rounded-xl" />
        <Skeleton className="w-48 h-10 rounded-xl" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="glass-panel p-6 rounded-2xl">
          <Skeleton className="w-12 h-12 rounded-xl mb-4" />
          <Skeleton className="w-20 h-3 mb-2" />
          <Skeleton className="w-28 h-6" />
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
