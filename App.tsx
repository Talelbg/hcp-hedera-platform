
import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { MembershipDashboard } from './components/MembershipDashboard';
import { UserTable } from './components/UserTable';
import { CsvUploader } from './components/CsvUploader';
import { Invoicing } from './components/Invoicing';
import { EventManagement } from './components/EventManagement';
import { SmartOutreach } from './components/SmartOutreach';
import { AdminSettings } from './components/AdminSettings';
import { Reporting } from './components/Reporting';
import { UserProfile } from './components/UserProfile';
import { 
  DeveloperRecord, 
  DatasetVersion, 
  AdminUser, 
  Invoice, 
  CommunityAgreement, 
  CommunityEvent, 
  OutreachCampaign, 
  CommunityMasterRecord 
} from './types';
import { Database, ChevronDown, Layers, Sun, Moon, CheckCircle } from 'lucide-react';
import { LocalDB } from './services/localDatabase';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Loaded from LocalDB
  const [versions, setVersions] = useState<DatasetVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  
  const [viewParams, setViewParams] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // --- GLOBAL PERSISTENT STATE (Loaded from LocalDB) ---
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [agreements, setAgreements] = useState<CommunityAgreement[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>([]);
  const [masterRegistry, setMasterRegistry] = useState<CommunityMasterRecord[]>([]);

  // --- INITIALIZATION: Load from Local Database ---
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    // Load Data
    setAdmins(LocalDB.getAdmins());
    setInvoices(LocalDB.getInvoices());
    setAgreements(LocalDB.getAgreements());
    setEvents(LocalDB.getEvents());
    setCampaigns(LocalDB.getCampaigns());
    setMasterRegistry(LocalDB.getMasterRegistry());
    
    const savedVersions = LocalDB.getDatasetVersions();
    setVersions(savedVersions);
    if (savedVersions.length > 0) {
        setActiveVersionId(savedVersions[0].id);
    }
  }, []);

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => { if(admins.length) LocalDB.saveAdmins(admins); }, [admins]);
  useEffect(() => { if(invoices.length) LocalDB.saveInvoices(invoices); }, [invoices]);
  useEffect(() => { if(agreements.length) LocalDB.saveAgreements(agreements); }, [agreements]);
  useEffect(() => { if(events.length) LocalDB.saveEvents(events); }, [events]);
  useEffect(() => { if(campaigns.length) LocalDB.saveCampaigns(campaigns); }, [campaigns]);
  useEffect(() => { if(masterRegistry.length) LocalDB.saveMasterRegistry(masterRegistry); }, [masterRegistry]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const developerData = useMemo(() => {
      if (!activeVersionId) return [];
      return versions.find(v => v.id === activeVersionId)?.data || [];
  }, [versions, activeVersionId]);

  const activeVersionName = useMemo(() => {
      if (!activeVersionId) return '';
      return versions.find(v => v.id === activeVersionId)?.fileName || 'Unknown Version';
  }, [versions, activeVersionId]);

  // Assume First Admin is Current User for Demo
  const currentUser = admins.length > 0 ? admins[0] : {
      id: 'admin_default', name: 'Super Admin', email: 'admin@hedera.com', role: 'Super Admin (HQ)', assignedCodes: [], lastLogin: new Date().toISOString(), status: 'Active'
  } as AdminUser;

  const handleUpdateProfile = (updatedUser: AdminUser) => {
      setAdmins(admins.map(a => a.id === updatedUser.id ? updatedUser : a));
  };

  const handleDataLoaded = (newVersion: DatasetVersion) => {
    setVersions(prev => [newVersion, ...prev]);
    setActiveVersionId(newVersion.id);
  };

  const handleSwitchVersion = (id: string) => setActiveVersionId(id);
  
  const handleDeleteVersion = (version: DatasetVersion) => {
      LocalDB.deleteDatasetVersion(version.id); // Delete from DB
      const newVersions = versions.filter(v => v.id !== version.id);
      setVersions(newVersions);
      if (activeVersionId === version.id) setActiveVersionId(newVersions.length > 0 ? newVersions[0].id : null);
  };

  const handleNavigate = (view: string, params?: any) => { setViewParams(params || null); setCurrentView(view); };
  const handleSidebarNavigate = (view: string) => { setViewParams(null); setCurrentView(view); };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return (
          <div className="space-y-6">
            <Dashboard data={developerData} onNavigate={handleNavigate} />
            {developerData.length === 0 && (
                 <div className="mt-8 fade-in-up p-12 border border-dashed border-slate-300 dark:border-white/10 rounded-3xl bg-white/50 dark:bg-[#141319]/50 shadow-sm backdrop-blur-sm">
                     <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-xl text-center">Initial Blockchain Sync Required</h3>
                     <p className="text-slate-500 dark:text-slate-400 text-center mb-6 max-w-md mx-auto">Upload your developer dataset to initialize the dashboard nodes.</p>
                     <div className="max-w-2xl mx-auto">
                        <CsvUploader onDataLoaded={handleDataLoaded} versions={versions} activeVersionId={activeVersionId || undefined} onVersionSelect={handleSwitchVersion} onDeleteVersion={handleDeleteVersion} />
                     </div>
                 </div>
            )}
          </div>
        );
      case 'membership': return <MembershipDashboard data={developerData} onBack={viewParams ? () => handleSidebarNavigate('dashboard') : undefined} />;
      case 'developers': return (
          <div className="space-y-6">
            <CsvUploader onDataLoaded={handleDataLoaded} versions={versions} activeVersionId={activeVersionId || undefined} onVersionSelect={handleSwitchVersion} onDeleteVersion={handleDeleteVersion} />
            {developerData.length > 0 && <UserTable data={developerData} initialFilters={viewParams} onBack={viewParams ? () => handleSidebarNavigate('dashboard') : undefined} />}
          </div>
        );
      case 'outreach': return <SmartOutreach data={developerData} campaigns={campaigns} setCampaigns={setCampaigns} />;
      case 'invoices': return (
        <Invoicing 
          data={developerData} 
          admins={admins} 
          invoices={invoices} 
          setInvoices={setInvoices}
          agreements={agreements}
          setAgreements={setAgreements}
        />
      );
      case 'reporting': return <Reporting data={developerData} />;
      case 'events': return <EventManagement data={developerData} events={events} setEvents={setEvents} />;
      case 'admin': return (
        <AdminSettings 
          data={developerData} 
          admins={admins} 
          setAdmins={setAdmins}
          masterRegistry={masterRegistry}
          setMasterRegistry={setMasterRegistry}
        />
      );
      case 'profile': return (
        <UserProfile user={currentUser} onUpdate={handleUpdateProfile} />
      );
      default: return <div className="p-10 text-center text-slate-400">Module under construction</div>;
    }
  };

  return (
    <div className="flex bg-slate-50 dark:bg-[#141319] min-h-screen font-sans text-slate-900 dark:text-slate-200 selection:bg-[#2a00ff] selection:text-white transition-colors duration-300">
      <Sidebar currentView={currentView} setCurrentView={handleSidebarNavigate} />
      
      <main className="flex-1 h-screen overflow-y-auto relative scroll-smooth">
        {/* Ambient Background Glow (Dark Mode Only) */}
        <div className="hidden dark:block fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#791cf5]/10 blur-[150px] pointer-events-none rounded-full animate-pulse-slow"></div>
        <div className="hidden dark:block fixed bottom-[-10%] left-[-10%] w-[900px] h-[900px] bg-[#2a00ff]/5 blur-[150px] pointer-events-none rounded-full animate-pulse-slow"></div>

        {/* Header */}
        <header className="bg-white/80 dark:bg-[#141319]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 h-20 px-8 sticky top-0 z-40 flex items-center justify-between shadow-sm dark:shadow-2xl print:hidden transition-all duration-300">
          <div className="flex items-center gap-4">
             <div className="p-2.5 bg-[#2a00ff]/10 border border-[#2a00ff]/20 rounded-xl text-[#2a00ff] shadow-[0_0_15px_rgba(42,0,255,0.2)]">
                <Layers className="w-5 h-5" />
             </div>
             <div className="flex flex-col">
                 <span className="text-[10px] font-extrabold text-[#a522dd] uppercase tracking-[0.2em]">Hedera Certification</span>
                 <span className="text-lg font-bold text-slate-900 dark:text-white capitalize leading-none mt-0.5">{currentView.replace('-', ' ')}</span>
             </div>
          </div>

          <div className="flex items-center gap-6">
             {versions.length > 0 && (
                 <div className="hidden md:block relative group">
                     <button className="flex items-center gap-3 px-5 py-2.5 bg-white dark:bg-[#1c1b22] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-[#2a00ff]/50 hover:shadow-[0_0_20px_rgba(42,0,255,0.15)] transition-all">
                        <Database className="w-4 h-4 text-[#2a00ff]" />
                        <span className="max-w-[150px] truncate">{activeVersionName}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-[#2a00ff] transition-colors" />
                     </button>
                     <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-[#1c1b22] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden transform group-hover:translate-y-0 translate-y-2">
                         <div className="px-5 py-3 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select Dataset Version</div>
                         <div className="max-h-64 overflow-y-auto p-2">
                             {versions.map(v => (
                                 <button key={v.id} onClick={() => handleSwitchVersion(v.id)} className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between rounded-xl mb-1 transition-colors ${v.id === activeVersionId ? 'bg-[#2a00ff]/10 text-[#2a00ff] font-semibold border border-[#2a00ff]/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}>
                                     <span className="truncate">{v.fileName}</span>
                                     {v.id === activeVersionId && <CheckCircle className="w-4 h-4 text-[#2a00ff]" />}
                                 </button>
                             ))}
                         </div>
                     </div>
                 </div>
             )}

             <div className="flex items-center gap-4 pl-6 border-l border-slate-200 dark:border-white/10">
                 <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-[#2a00ff] dark:hover:text-[#2a00ff] transition-all hover:scale-110">
                     {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                 </button>
                 <div 
                    onClick={() => setCurrentView('profile')}
                    className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#2a00ff] to-[#a522dd] flex items-center justify-center text-xs font-extrabold text-white shadow-lg shadow-[#2a00ff]/30 cursor-pointer hover:scale-105 transition-transform border border-white/10 relative overflow-hidden group"
                 >
                     <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     SA
                 </div>
             </div>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto">
            {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
