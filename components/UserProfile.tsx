
import React, { useState } from 'react';
import { AdminUser, UserRole } from '../types';
import { User, Mail, Shield, Map, Save, Check, Clock, Activity } from 'lucide-react';

interface UserProfileProps {
  user: AdminUser;
  onUpdate: (updatedUser: AdminUser) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      onUpdate({ ...user, name });
      setIsSaving(false);
      setSuccessMsg('Profile updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 800);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your account settings and view assigned permissions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Identity */}
        <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#2a00ff]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex items-center gap-6 mb-8 relative z-10">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#2a00ff] to-[#a522dd] flex items-center justify-center text-3xl font-extrabold text-white shadow-xl shadow-[#2a00ff]/30">
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                user.role === UserRole.SUPER_ADMIN ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' :
                                user.role === UserRole.REGIONAL_ADMIN ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                                'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                            }`}>
                                {user.role}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                <Activity className="w-3 h-3" /> Active
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#2a00ff] outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Email Address</label>
                        <div className="relative opacity-75">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                value={user.email} 
                                disabled
                                className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-6">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Last login: <span className="font-mono text-slate-700 dark:text-slate-300">{new Date(user.lastLogin).toLocaleString()}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        {successMsg && (
                            <span className="text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-1 animate-fade-in">
                                <Check className="w-4 h-4" /> {successMsg}
                            </span>
                        )}
                        <button 
                            onClick={handleSave}
                            disabled={isSaving || !name.trim()}
                            className="px-6 py-2.5 bg-[#2a00ff] text-white rounded-xl font-bold text-sm hover:bg-[#2a00ff]/90 shadow-lg shadow-[#2a00ff]/20 flex items-center gap-2 disabled:opacity-50 transition-all"
                        >
                            {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Scope */}
        <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-full">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
                    <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-500 dark:text-slate-300">
                        <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Assigned Scope</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Access Level</div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300">
                            {user.role}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center justify-between">
                            Managed Communities
                            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-full">
                                {user.role === UserRole.SUPER_ADMIN ? 'ALL' : user.assignedCodes.length}
                            </span>
                        </div>
                        
                        {user.role === UserRole.SUPER_ADMIN ? (
                            <div className="p-4 bg-gradient-to-br from-[#2a00ff]/5 to-transparent border border-[#2a00ff]/20 rounded-xl text-[#2a00ff] text-sm font-bold flex items-center gap-2">
                                <Map className="w-4 h-4" /> Global Access (All Regions)
                            </div>
                        ) : user.assignedCodes.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {user.assignedCodes.map(code => (
                                    <div key={code} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#2a00ff]"></div>
                                        {code}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-400 italic p-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center">
                                No specific communities assigned.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
