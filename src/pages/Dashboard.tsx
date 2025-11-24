import React from 'react';
import { Sparkles, Calendar, Filter, Activity } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Global Overview Section */}
      <div className="bg-[#12121A] rounded-2xl p-6 border border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <div>
             <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Global Overview <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
             </h2>
             <p className="text-gray-400 text-sm mt-1">Viewing all 0 records</p>
          </div>
          <button className="flex items-center gap-2 bg-[#4F46E5] hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors font-medium">
             <Sparkles size={16} />
             AI Insights
          </button>
        </div>

        <div className="space-y-4">
             {/* Community Node Filter */}
             <div>
                 <label className="text-xs font-bold text-purple-400 uppercase tracking-wide mb-2 block">Community Node</label>
                 <div className="bg-[#0B0B15] border border-gray-700 rounded-lg p-3 flex items-center text-white cursor-pointer hover:border-gray-500 transition-colors">
                     <Filter size={16} className="text-gray-400 mr-3" />
                     <span className="font-medium">Global (All)</span>
                 </div>
             </div>

             {/* Time Epoch Filter */}
             <div>
                 <label className="text-xs font-bold text-purple-400 uppercase tracking-wide mb-2 block">Time Epoch</label>
                 <div className="bg-[#0B0B15] border border-gray-700 rounded-lg p-3 flex items-center text-white cursor-pointer hover:border-gray-500 transition-colors">
                     <Calendar size={16} className="text-gray-400 mr-3" />
                     <span className="font-medium">All Time</span>
                 </div>
             </div>

             {/* Apply Filter Button */}
             <button className="w-full bg-[#1E1E2D] border border-gray-700 hover:bg-gray-800 text-gray-300 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                 <span>Apply Filter</span>
             </button>
        </div>
      </div>

      {/* Executive AI Summary */}
      <div className="bg-[#0B0B15] rounded-2xl p-1 border border-purple-500/30">
        <div className="bg-[#12121A] rounded-xl p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

            <div className="flex items-start gap-4">
                <div className="p-3 bg-[#1E1B3A] rounded-lg border border-purple-500/20">
                    <Activity className="text-purple-400" size={24} />
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">Executive AI Summary</h3>
                        <span className="bg-[#1E1E2D] border border-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">Gemini 2.5</span>
                    </div>
                    <p className="text-gray-400">No data available. Please upload a CSV file.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
