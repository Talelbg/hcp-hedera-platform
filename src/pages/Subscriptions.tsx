import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscriptionService } from '../services/subscriptionService';
import { DeveloperRecord } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  Search,
  Plus,
  Filter,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';

const Subscriptions: React.FC = () => {
  const { user, role } = useAuth();
  const [data, setData] = useState<DeveloperRecord[]>([]);
  const [filteredData, setFilteredData] = useState<DeveloperRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [communityFilter, setCommunityFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DeveloperRecord | null>(null);
  const [formData, setFormData] = useState<Partial<DeveloperRecord>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        let partnerCodeFilter = 'All';

        if (role === 'community' || role === 'regional') { // Community or Regional Admin
             // Fetch assigned codes from user profile
             const userDoc = await getDoc(doc(db, 'users', user.uid));
             if (userDoc.exists()) {
                 const userData = userDoc.data();
                 // Assuming assignedPartnerCodes is an array, we pick the first one for now or handle multiple
                 // For this prototype, let's assume one code or filtered by the first one.
                 // In a real app, we'd handle multiple codes logic in service.
                 const codes = userData.assignedPartnerCodes || userData.assignedCodes || [];
                 if (codes.length > 0) {
                     partnerCodeFilter = codes[0];
                 }
             }
        }

        const records = await subscriptionService.getSubscriptions(partnerCodeFilter);
        setData(records);
        setFilteredData(records);
      } catch (error) {
        console.error("Failed to load subscriptions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, role]);

  useEffect(() => {
    let result = data;

    // Search
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        result = result.filter(d =>
            d.email.toLowerCase().includes(lower) ||
            d.firstName.toLowerCase().includes(lower) ||
            d.lastName.toLowerCase().includes(lower) ||
            d.partnerCode.toLowerCase().includes(lower)
        );
    }

    // Filter by Community (only for super_admin who sees all)
    if (role === 'super_admin' && communityFilter !== 'All') {
        result = result.filter(d => d.partnerCode === communityFilter);
    }

    setFilteredData(result);
  }, [data, searchTerm, communityFilter, role]);

  const communities = ['All', ...Array.from(new Set(data.map(d => d.partnerCode))).sort()];

  // Form Handlers
  const handleEdit = (record: DeveloperRecord) => {
      setEditingRecord(record);
      setFormData(record);
      setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
      if (window.confirm('Are you sure you want to delete this subscription?')) {
          try {
              await subscriptionService.deleteSubscription(id);
              setData(data.filter(d => d.id !== id));
          } catch (e) {
              alert('Failed to delete');
          }
      }
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (editingRecord) {
              await subscriptionService.updateSubscription(editingRecord.id, formData);
              setData(data.map(d => d.id === editingRecord.id ? { ...d, ...formData } as DeveloperRecord : d));
          } else {
              const newRecord = {
                  ...formData,
                  createdAt: new Date().toISOString(),
                  percentageCompleted: 0,
                  finalGrade: 'Pending',
                  // defaults
                  acceptedMembership: formData.acceptedMembership || false,
                  acceptedMarketing: formData.acceptedMarketing || false,
              } as any;
              const saved = await subscriptionService.addSubscription(newRecord);
              setData([saved, ...data]);
          }
          setIsModalOpen(false);
          setEditingRecord(null);
          setFormData({});
      } catch (err) {
          console.error(err);
          alert('Failed to save record.');
      }
  };

  return (
    <div className="p-8 min-h-screen bg-slate-50 dark:bg-dark text-gray-900 dark:text-white">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold">Subscriptions</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Manage participant enrollments.</p>
            </div>
            <button
                onClick={() => { setEditingRecord(null); setFormData({}); setIsModalOpen(true); }}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
            >
                <Plus size={18} /> Add Subscription
            </button>
        </header>

        {/* Filters */}
        <div className="bg-white dark:bg-dark-panel p-4 rounded-lg shadow mb-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by name, email, or code..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            {role === 'super_admin' && (
                <div className="relative w-full md:w-64">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                        value={communityFilter}
                        onChange={e => setCommunityFilter(e.target.value)}
                    >
                        {communities.map(c => <option key={c} value={c}>{c === 'All' ? 'All Communities' : c}</option>)}
                    </select>
                </div>
            )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-dark-panel rounded-lg shadow overflow-hidden overflow-x-auto">
            {loading ? (
                <div className="p-12 flex justify-center">
                    <Loader className="animate-spin text-primary" size={32} />
                </div>
            ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Participant</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Community</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progress</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {filteredData.map(record => (
                            <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium">{record.firstName} {record.lastName}</div>
                                    <div className="text-xs text-gray-500">{record.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">
                                        {record.partnerCode}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 max-w-[100px] mb-1">
                                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${record.percentageCompleted || 0}%` }}></div>
                                    </div>
                                    <span className="text-xs text-gray-500">{record.percentageCompleted || 0}%</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {record.finalGrade === 'Pass' ? (
                                        <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                                            <CheckCircle size={14} /> Certified
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-500">In Progress</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleEdit(record)} className="text-blue-500 hover:text-blue-700"><Edit size={16}/></button>
                                        <button onClick={() => handleDelete(record.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No records found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>

        {/* Edit/Add Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-dark-panel rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold">{editingRecord ? 'Edit Subscription' : 'New Subscription'}</h2>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700"><XCircle /></button>
                    </div>
                    <form onSubmit={handleSave} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">First Name</label>
                            <input type="text" required className="w-full px-3 py-2 rounded border dark:bg-dark dark:border-gray-700"
                                value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Last Name</label>
                            <input type="text" required className="w-full px-3 py-2 rounded border dark:bg-dark dark:border-gray-700"
                                value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input type="email" required className="w-full px-3 py-2 rounded border dark:bg-dark dark:border-gray-700"
                                value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <input type="text" className="w-full px-3 py-2 rounded border dark:bg-dark dark:border-gray-700"
                                value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Country</label>
                            <input type="text" className="w-full px-3 py-2 rounded border dark:bg-dark dark:border-gray-700"
                                value={formData.country || ''} onChange={e => setFormData({...formData, country: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Partner Code</label>
                            <input type="text" required className="w-full px-3 py-2 rounded border dark:bg-dark dark:border-gray-700"
                                value={formData.partnerCode || ''} onChange={e => setFormData({...formData, partnerCode: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Wallet Address</label>
                            <input type="text" className="w-full px-3 py-2 rounded border dark:bg-dark dark:border-gray-700"
                                value={formData.walletAddress || ''} onChange={e => setFormData({...formData, walletAddress: e.target.value})} />
                        </div>
                        <div className="md:col-span-2 flex gap-6 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.acceptedMembership || false}
                                    onChange={e => setFormData({...formData, acceptedMembership: e.target.checked})} />
                                <span className="text-sm">Accepted Membership</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.acceptedMarketing || false}
                                    onChange={e => setFormData({...formData, acceptedMarketing: e.target.checked})} />
                                <span className="text-sm">Accepted Marketing</span>
                            </label>
                        </div>
                        <div className="md:col-span-2 border-t pt-4 mt-2 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-primary text-white rounded hover:bg-primary-dark font-bold">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Subscriptions;
